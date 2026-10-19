-- LaLinea Game: credito personale fino a 200 euro, buoni monouso.
-- Eseguire nel SQL Editor del progetto Supabase già collegato al sito.
-- Le operazioni di saldo, buono e riscatto sono transazioni atomiche.
begin;

create table if not exists public.llg_wallets (
  customer_id text primary key,
  highest_level integer not null default 0 check (highest_level between 0 and 50),
  earned_cents integer not null default 0 check (earned_cents between 0 and 20000),
  spent_cents integer not null default 0 check (spent_cents between 0 and earned_cents),
  updated_at timestamptz not null default now()
);
create table if not exists public.llg_runs (
  id uuid primary key,
  customer_id text not null references public.llg_wallets(customer_id),
  level integer not null check (level between 1 and 50),
  seed integer not null,
  engine text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  coins integer,
  hearts integer
);
create index if not exists llg_runs_owner_idx on public.llg_runs(customer_id, created_at);
create table if not exists public.llg_rewards (
  customer_id text not null references public.llg_wallets(customer_id),
  level integer not null check (level between 1 and 50),
  run_id uuid not null references public.llg_runs(id),
  amount_cents integer not null check (amount_cents > 0),
  coins integer not null,
  hearts integer not null,
  created_at timestamptz not null default now(),
  primary key (customer_id, level),
  unique (run_id)
);
create table if not exists public.llg_vouchers (
  id uuid primary key,
  customer_id text not null references public.llg_wallets(customer_id),
  code text not null unique check (code ~ '^LLG-[A-F0-9]{24}$'),
  amount_cents integer not null check (amount_cents between 1 and 20000),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  used_at timestamptz,
  request_key uuid,
  context_hash text,
  order_id text,
  applied_cents integer,
  points_debited integer not null default 0
);
create unique index if not exists llg_one_live_voucher on public.llg_vouchers(customer_id)
  where used_at is null and cancelled_at is null;
create unique index if not exists llg_voucher_request_unique on public.llg_vouchers(customer_id, request_key)
  where request_key is not null;
create table if not exists public.llg_request_limits (
  key text primary key,
  attempts integer not null,
  resets_at timestamptz not null
);

create or replace function public.llg_limit(p_key text, p_max integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  delete from public.llg_request_limits where resets_at < now() - interval '1 day';
  insert into public.llg_request_limits as current_limit(key, attempts, resets_at)
  values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict(key) do update set
    attempts = case when current_limit.resets_at <= now() then 1 else current_limit.attempts + 1 end,
    resets_at = case when current_limit.resets_at <= now() then now() + make_interval(secs => p_seconds) else current_limit.resets_at end
  returning attempts into v_count;
  return v_count <= p_max;
end;
$$;

create or replace function public.llg_state(p_customer_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_wallet public.llg_wallets%rowtype; v_levels jsonb; v_voucher jsonb;
begin
  insert into public.llg_wallets(customer_id) values(p_customer_id) on conflict do nothing;
  select * into v_wallet from public.llg_wallets where customer_id = p_customer_id;
  select coalesce(jsonb_agg(jsonb_build_object('level', level, 'coins', coins, 'hearts', hearts) order by level), '[]'::jsonb)
    into v_levels from public.llg_rewards where customer_id = p_customer_id;
  select jsonb_build_object('code', code, 'amountCents', amount_cents)
    into v_voucher from public.llg_vouchers
    where customer_id = p_customer_id and used_at is null and cancelled_at is null limit 1;
  return jsonb_build_object('highestLevel', v_wallet.highest_level, 'earnedCents', v_wallet.earned_cents,
    'spentCents', v_wallet.spent_cents, 'availableCents', v_wallet.earned_cents - v_wallet.spent_cents,
    'completed', v_levels, 'voucher', v_voucher);
end;
$$;

create or replace function public.llg_start(p_customer_id text, p_run_id uuid, p_level integer, p_seed integer, p_engine text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_wallet public.llg_wallets%rowtype; v_run public.llg_runs%rowtype;
begin
  insert into public.llg_wallets(customer_id) values(p_customer_id) on conflict do nothing;
  select * into v_wallet from public.llg_wallets where customer_id = p_customer_id for update;
  if p_level not between 1 and 50 or p_level > v_wallet.highest_level + 1 then raise exception 'LLG_LEVEL_LOCKED'; end if;
  insert into public.llg_runs(id, customer_id, level, seed, engine)
    values(p_run_id, p_customer_id, p_level, p_seed, p_engine) returning * into v_run;
  return jsonb_build_object('id', v_run.id, 'level', v_run.level, 'seed', v_run.seed,
    'engine', v_run.engine, 'createdAt', v_run.created_at);
end;
$$;

create or replace function public.llg_complete(p_customer_id text, p_run_id uuid, p_coins integer, p_hearts integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_wallet public.llg_wallets%rowtype; v_run public.llg_runs%rowtype; v_target integer; v_credit integer := 0;
begin
  select * into v_wallet from public.llg_wallets where customer_id = p_customer_id for update;
  select * into v_run from public.llg_runs where id = p_run_id and customer_id = p_customer_id for update;
  if not found then raise exception 'LLG_RUN_NOT_FOUND'; end if;
  if v_run.completed_at is not null then return public.llg_state(p_customer_id) || jsonb_build_object('creditedCents', 0); end if;
  if v_run.created_at < now() - interval '20 minutes' then raise exception 'LLG_RUN_EXPIRED'; end if;
  if v_run.level > v_wallet.highest_level + 1 then raise exception 'LLG_LEVEL_LOCKED'; end if;
  if v_run.level = v_wallet.highest_level + 1 then
    v_target := case v_run.level when 1 then 200 when 2 then 500 when 3 then 1000
      else (10 + round((v_run.level - 3) * 190.0 / 47))::integer * 100 end;
    v_credit := v_target - v_wallet.earned_cents;
    insert into public.llg_rewards(customer_id, level, run_id, amount_cents, coins, hearts)
      values(p_customer_id, v_run.level, p_run_id, v_credit, p_coins, p_hearts);
    update public.llg_wallets set highest_level = v_run.level, earned_cents = v_target, updated_at = now()
      where customer_id = p_customer_id;
  else
    update public.llg_rewards set coins = greatest(coins, p_coins), hearts = greatest(hearts, p_hearts)
      where customer_id = p_customer_id and level = v_run.level;
  end if;
  update public.llg_runs set completed_at = now(), coins = p_coins, hearts = p_hearts where id = p_run_id;
  return public.llg_state(p_customer_id) || jsonb_build_object('creditedCents', v_credit);
end;
$$;

create or replace function public.llg_voucher(p_customer_id text, p_voucher_id uuid, p_code text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_wallet public.llg_wallets%rowtype; v_amount integer; v_old public.llg_vouchers%rowtype;
begin
  select * into v_wallet from public.llg_wallets where customer_id = p_customer_id for update;
  v_amount := v_wallet.earned_cents - v_wallet.spent_cents;
  if v_amount is null or v_amount <= 0 then raise exception 'LLG_NO_CREDIT'; end if;
  select * into v_old from public.llg_vouchers where customer_id = p_customer_id and used_at is null and cancelled_at is null;
  if found and v_old.amount_cents = v_amount then return public.llg_state(p_customer_id); end if;
  update public.llg_vouchers set cancelled_at = now() where customer_id = p_customer_id and used_at is null and cancelled_at is null;
  insert into public.llg_vouchers(id, customer_id, code, amount_cents) values(p_voucher_id, p_customer_id, p_code, v_amount);
  return public.llg_state(p_customer_id);
end;
$$;

create or replace function public.llg_consume(p_customer_id text, p_code text, p_request_key uuid,
  p_context_hash text, p_total_cents integer, p_points integer, p_delivery_cents integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_wallet public.llg_wallets%rowtype; v_voucher public.llg_vouchers%rowtype;
  v_applied integer; v_points bigint; v_order_id text;
begin
  if p_total_cents <= 0 or p_total_cents > 100000000 or p_points < 0 or p_points > 1000000
    or p_delivery_cents < 0 or p_delivery_cents > 1000000 or length(p_context_hash) <> 64 or p_request_key is null then raise exception 'LLG_INVALID_ORDER'; end if;
  select * into v_wallet from public.llg_wallets where customer_id = p_customer_id for update;
  select * into v_voucher from public.llg_vouchers where code = p_code and customer_id = p_customer_id for update;
  if not found then raise exception 'LLG_VOUCHER_NOT_FOUND'; end if;
  if v_voucher.used_at is not null then
    if v_voucher.request_key <> p_request_key or v_voucher.context_hash <> p_context_hash then raise exception 'LLG_VOUCHER_USED'; end if;
    select coalesce(punti,0)::bigint into v_points from public.vip_customers where id::text = p_customer_id;
    return public.llg_state(p_customer_id) || jsonb_build_object('appliedCents', v_voucher.applied_cents,
      'pointsDebited', v_voucher.points_debited, 'pointsRemaining', v_points, 'receipt', v_voucher.request_key, 'orderId', v_voucher.order_id, 'replayed', true);
  end if;
  if v_voucher.cancelled_at is not null then raise exception 'LLG_VOUCHER_CANCELLED'; end if;
  v_applied := least(v_voucher.amount_cents, v_wallet.earned_cents - v_wallet.spent_cents, p_total_cents);
  if v_applied <= 0 then raise exception 'LLG_NO_CREDIT'; end if;
  select coalesce(punti,0)::bigint into v_points from public.vip_customers where id::text = p_customer_id for update;
  if not found then raise exception 'LLG_CUSTOMER_NOT_FOUND'; end if;
  if v_points < p_points then raise exception 'LLG_POINTS_INSUFFICIENT'; end if;
  if p_points > 0 then update public.vip_customers set punti = coalesce(punti,0) - p_points where id::text = p_customer_id; end if;
  insert into public.vip_orders(customer_id, totale_prodotti, costo_consegna, stato)
    select id, p_total_cents / 100.0, p_delivery_cents / 100.0, 'pending'
    from public.vip_customers where id::text = p_customer_id returning id::text into v_order_id;
  update public.llg_wallets set spent_cents = spent_cents + v_applied, updated_at = now() where customer_id = p_customer_id;
  update public.llg_vouchers set used_at = now(), request_key = p_request_key, context_hash = p_context_hash,
    applied_cents = v_applied, points_debited = p_points, order_id = v_order_id where id = v_voucher.id;
  return public.llg_state(p_customer_id) || jsonb_build_object('appliedCents', v_applied, 'pointsDebited', p_points,
    'pointsRemaining', v_points - p_points, 'receipt', p_request_key, 'orderId', v_order_id, 'replayed', false);
end;
$$;

alter table public.llg_wallets enable row level security;
alter table public.llg_runs enable row level security;
alter table public.llg_rewards enable row level security;
alter table public.llg_vouchers enable row level security;
alter table public.llg_request_limits enable row level security;
revoke all on public.llg_wallets, public.llg_runs, public.llg_rewards, public.llg_vouchers, public.llg_request_limits from public, anon, authenticated;
grant all on public.llg_wallets, public.llg_runs, public.llg_rewards, public.llg_vouchers, public.llg_request_limits to service_role;
revoke execute on function public.llg_limit(text,integer,integer), public.llg_state(text),
  public.llg_start(text,uuid,integer,integer,text), public.llg_complete(text,uuid,integer,integer),
  public.llg_voucher(text,uuid,text), public.llg_consume(text,text,uuid,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.llg_limit(text,integer,integer), public.llg_state(text),
  public.llg_start(text,uuid,integer,integer,text), public.llg_complete(text,uuid,integer,integer),
  public.llg_voucher(text,uuid,text), public.llg_consume(text,text,uuid,text,integer,integer,integer) to service_role;
notify pgrst, 'reload schema';
commit;
