-- La Milanese: saldo VIP esistente, portafoglio LL, buoni slot monouso.
-- Migrazione additiva. Nessuna modifica ai saldi o agli ordini all'installazione.
begin;

do $preflight$
begin
  if to_regclass('public.vip_customers') is null or to_regclass('public.vip_orders') is null then
    raise exception 'Progetto Supabase errato: mancano le tabelle VIP del sito.';
  end if;
  perform c.id, c.punti from public.vip_customers c where false;
  perform o.id, o.customer_id, o.totale_prodotti, o.costo_consegna, o.stato
    from public.vip_orders o where false;
end;
$preflight$;

create table if not exists public.llm_wallets (
  customer_id text primary key,
  ll bigint not null default 0 check (ll >= 0),
  spent bigint not null default 0 check (spent >= 0),
  redemptions bigint not null default 0 check (redemptions >= 0 and redemptions * 200 <= spent),
  spins bigint not null default 0 check (spins >= 0),
  free_spins integer not null default 0 check (free_spins >= 0),
  active_ms integer not null default 0 check (active_ms between 0 and 1800000),
  bonus_day date,
  last_spin_at timestamptz,
  last_board jsonb,
  last_win integer not null default 0 check (last_win >= 0)
);

create table if not exists public.llm_actions (
  customer_id text not null references public.llm_wallets(customer_id),
  request_id uuid not null,
  action text not null check (action in ('spin', 'bonus', 'redeem')),
  choice integer,
  outcome jsonb not null,
  created_at timestamptz not null,
  primary key (customer_id, request_id)
);

create index if not exists llm_spin_history_idx
  on public.llm_actions(customer_id, created_at desc)
  where action = 'spin';

create table if not exists public.llm_vouchers (
  code text primary key check (code ~ '^LLM-[A-F0-9]{24}$'),
  customer_id text not null references public.llm_wallets(customer_id),
  amount_cents integer not null check (amount_cents in (5000, 10000)),
  created_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > created_at),
  used_at timestamptz,
  checkout_hash text,
  applied_cents integer check (applied_cents > 0 and applied_cents <= amount_cents),
  order_id text,
  points_debited integer not null default 0 check (points_debited >= 0),
  check (
    (used_at is null and checkout_hash is null and applied_cents is null and order_id is null)
    or
    (used_at is not null and checkout_hash ~ '^[a-f0-9]{64}$' and checkout_hash is not null
      and applied_cents is not null and order_id is not null)
  )
);

create index if not exists llm_vouchers_owner_idx
  on public.llm_vouchers(customer_id, created_at desc);

create or replace function public.llm_state(p_customer_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $state$
declare
  v_points bigint;
  v_wallet public.llm_wallets%rowtype;
  v_history jsonb;
  v_vouchers jsonb;
begin
  select coalesce(c.punti, 0)::bigint into v_points
    from public.vip_customers c where c.id::text = p_customer_id;
  if not found then
    return jsonb_build_object('error', 'VIP_REQUIRED');
  end if;

  select * into v_wallet from public.llm_wallets where customer_id = p_customer_id;
  select coalesce(jsonb_agg(recent.outcome order by recent.created_at desc), '[]'::jsonb)
    into v_history
    from (
      select outcome, created_at from public.llm_actions
      where customer_id = p_customer_id and action = 'spin'
      order by created_at desc limit 12
    ) recent;
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', recent.code,
    'euro', recent.amount_cents / 100,
    'createdAt', floor(extract(epoch from recent.created_at) * 1000)::bigint,
    'expiresAt', floor(extract(epoch from recent.expires_at) * 1000)::bigint,
    'used', recent.used_at is not null
  ) order by recent.created_at desc), '[]'::jsonb)
    into v_vouchers
    from (
      select code, amount_cents, created_at, expires_at, used_at from public.llm_vouchers
      where customer_id = p_customer_id
        and (used_at is null and expires_at > now() or created_at > now() - interval '30 days')
      order by (used_at is null and expires_at > now()) desc, created_at desc limit 100
    ) recent;

  return jsonb_build_object(
    'points', v_points, 'll', coalesce(v_wallet.ll, 0),
    'spent', coalesce(v_wallet.spent, 0), 'redemptions', coalesce(v_wallet.redemptions, 0),
    'spins', coalesce(v_wallet.spins, 0), 'freeSpins', coalesce(v_wallet.free_spins, 0),
    'activeMs', coalesce(v_wallet.active_ms, 0), 'bonusDay', coalesce(v_wallet.bonus_day::text, ''),
    'lastBoard', v_wallet.last_board, 'lastWin', coalesce(v_wallet.last_win, 0),
    'coupons', v_vouchers, 'history', v_history
  );
end;
$state$;

create or replace function public.llm_play(
  p_customer_id text, p_request_id uuid, p_action text, p_choice integer,
  p_board jsonb, p_base_ll integer, p_bonus_roll integer, p_code text
)
returns jsonb language plpgsql security invoker set search_path = '' as $play$
declare
  v_customer public.vip_customers%rowtype;
  v_wallet public.llm_wallets%rowtype;
  v_previous public.llm_actions%rowtype;
  v_now timestamptz;
  v_day date;
  v_outcome jsonb;
  v_free boolean;
  v_bet integer;
  v_debit integer;
  v_ll integer;
  v_extra integer;
  v_prize integer := 0;
begin
  if p_request_id is null or p_action is null or p_action not in ('spin', 'bonus', 'redeem') then
    return jsonb_build_object('error', 'BAD_REQUEST');
  end if;

  -- Il lock è sullo stesso saldo letto dal pannello VIP e dalle altre operazioni.
  select * into v_customer from public.vip_customers
    where id::text = p_customer_id for update;
  if not found then
    return jsonb_build_object('error', 'VIP_REQUIRED');
  end if;

  select * into v_previous from public.llm_actions
    where customer_id = p_customer_id and request_id = p_request_id;
  if found then
    if v_previous.action <> p_action or v_previous.choice is distinct from p_choice then
      return jsonb_build_object('error', 'REQUEST_CONFLICT');
    end if;
    return jsonb_build_object('state', public.llm_state(p_customer_id), 'outcome', v_previous.outcome);
  end if;

  insert into public.llm_wallets(customer_id) values(p_customer_id) on conflict do nothing;
  select * into v_wallet from public.llm_wallets where customer_id = p_customer_id for update;
  v_now := clock_timestamp();
  v_day := (v_now at time zone 'Europe/Rome')::date;

  if p_action = 'spin' then
    if p_choice is null or p_choice not in (5,10,15,20,25,30,35,40,45,50)
      or p_base_ll is null or p_base_ll not between 0 and 1200
      or p_board is null or jsonb_typeof(p_board) <> 'array' then
      return jsonb_build_object('error', 'BAD_REQUEST');
    end if;
    if jsonb_array_length(p_board) <> 5 then
      return jsonb_build_object('error', 'BAD_REQUEST');
    end if;
    if v_wallet.last_spin_at > v_now - interval '1 second' then
      return jsonb_build_object('error', 'TOO_FAST', 'state', public.llm_state(p_customer_id));
    end if;

    v_free := v_wallet.free_spins > 0;
    v_bet := case when v_free then 10 else p_choice end;
    v_debit := case when v_free then 0 else v_bet end;
    if v_debit > 0 and coalesce(v_customer.punti, 0) < v_debit then
      return jsonb_build_object('error', 'LOW_POINTS', 'state', public.llm_state(p_customer_id));
    end if;
    v_ll := p_base_ll * (v_bet / 5);
    if v_debit > 0 then
      update public.vip_customers set punti = coalesce(punti, 0) - v_debit
        where id = v_customer.id;
    end if;
    -- Si conta il tempo tra due giri confermati a non più di un minuto.
    if v_wallet.bonus_day is distinct from v_day
      and v_wallet.last_spin_at >= v_now - interval '60 seconds' then
      v_wallet.active_ms := least(1800000, v_wallet.active_ms
        + floor(extract(epoch from (v_now - v_wallet.last_spin_at)) * 1000)::integer);
    end if;
    update public.llm_wallets set
      ll = ll + v_ll, spent = spent + v_debit, spins = spins + 1,
      free_spins = free_spins - case when v_free then 1 else 0 end,
      last_spin_at = v_now, last_board = p_board, last_win = v_ll, active_ms = v_wallet.active_ms
      where customer_id = p_customer_id;
    v_outcome := jsonb_build_object(
      'kind', 'spin', 'bet', v_bet, 'free', v_free, 'amount', v_ll,
      'board', p_board, 'debited', v_debit,
      'at', floor(extract(epoch from v_now) * 1000)::bigint
    );

  elsif p_action = 'bonus' then
    if p_choice is null or p_choice not between 0 and 2
      or p_bonus_roll is null or p_bonus_roll not between 0 and 99 then
      return jsonb_build_object('error', 'BAD_REQUEST');
    end if;
    if v_wallet.active_ms < 1800000 or v_wallet.bonus_day = v_day then
      return jsonb_build_object('error', 'BONUS_LOCKED', 'state', public.llm_state(p_customer_id));
    end if;
    v_extra := case when p_bonus_roll < 50 then 5 when p_bonus_roll < 85 then 10
      when p_bonus_roll < 99 then 15 else 0 end;
    if v_extra = 0 then v_prize := 5000; end if;
    update public.llm_wallets set active_ms = 0, bonus_day = v_day, free_spins = free_spins + v_extra,
      last_spin_at = null where customer_id = p_customer_id;
    v_outcome := jsonb_build_object('kind', 'bonus', 'spins', v_extra, 'euro', v_prize / 100);

  else
    if p_choice is not null then return jsonb_build_object('error', 'BAD_REQUEST'); end if;
    if v_wallet.ll < 1000 or v_wallet.spent - v_wallet.redemptions * 200 < 200 then
      return jsonb_build_object('error', 'REDEEM_LOCKED', 'state', public.llm_state(p_customer_id));
    end if;
    v_prize := 10000;
    update public.llm_wallets set ll = ll - 1000, redemptions = redemptions + 1
      where customer_id = p_customer_id;
    v_outcome := jsonb_build_object('kind', 'redeem', 'euro', 100);
  end if;

  if v_prize > 0 then
    if p_code is null or p_code !~ '^LLM-[A-F0-9]{24}$' then
      raise exception 'Formato buono La Milanese non valido.';
    end if;
    insert into public.llm_vouchers(code, customer_id, amount_cents, created_at, expires_at)
      values(p_code, p_customer_id, v_prize, v_now, v_now + interval '30 days');
    v_outcome := v_outcome || jsonb_build_object('code', p_code);
  end if;

  insert into public.llm_actions(customer_id, request_id, action, choice, outcome, created_at)
    values(p_customer_id, p_request_id, p_action, p_choice, v_outcome, v_now);
  return jsonb_build_object('state', public.llm_state(p_customer_id), 'outcome', v_outcome);
end;
$play$;

-- Controllo o utilizzo del buono. Un ordine pending e il consumo nascono insieme.
-- La stessa conferma può essere recuperata dopo un'interruzione di rete.
create or replace function public.llm_checkout(
  p_customer_id text, p_code text, p_mode text, p_hash text,
  p_subtotal_cents integer, p_delivery_cents integer, p_points integer
)
returns jsonb language plpgsql security invoker set search_path = '' as $checkout$
declare
  v_customer public.vip_customers%rowtype;
  v_coupon public.llm_vouchers%rowtype;
  v_applied integer;
  v_order_id text;
begin
  if p_code is null or p_code !~ '^LLM-[A-F0-9]{24}$'
    or p_mode is null or p_mode not in ('validate', 'status', 'consume') then
    return jsonb_build_object('error', 'BAD_REQUEST');
  end if;
  if p_mode <> 'validate' and (p_hash is null or p_hash !~ '^[a-f0-9]{64}$'
    or p_subtotal_cents is null or p_subtotal_cents not between 1 and 100000000
    or p_delivery_cents is null or p_delivery_cents not between 0 and 1000000
    or p_points is null or p_points not between 0 and 1000000) then
    return jsonb_build_object('error', 'BAD_ORDER');
  end if;

  if p_mode = 'consume' then
    select * into v_customer from public.vip_customers
      where id::text = p_customer_id for update;
    if not found then return jsonb_build_object('error', 'VIP_REQUIRED'); end if;
    select * into v_coupon from public.llm_vouchers
      where customer_id = p_customer_id and code = p_code for update;
  else
    select * into v_coupon from public.llm_vouchers
      where customer_id = p_customer_id and code = p_code;
  end if;

  if not found then return jsonb_build_object('error', 'VOUCHER_NOT_FOUND'); end if;
  if v_coupon.used_at is not null then
    if p_mode <> 'validate' and v_coupon.checkout_hash = p_hash then
      return jsonb_build_object('valido', true, 'used', true, 'orderId', v_coupon.order_id,
        'appliedCents', v_coupon.applied_cents, 'valore', v_coupon.amount_cents / 100,
        'pointsDebited', v_coupon.points_debited);
    end if;
    return jsonb_build_object('error', 'VOUCHER_USED');
  end if;
  if v_coupon.expires_at <= clock_timestamp() then
    return jsonb_build_object('error', 'VOUCHER_EXPIRED');
  end if;
  if p_mode <> 'consume' then
    return jsonb_build_object('valido', true, 'used', false, 'valore', v_coupon.amount_cents / 100);
  end if;

  if coalesce(v_customer.punti, 0) < p_points then
    return jsonb_build_object('error', 'LOW_POINTS_ORDER');
  end if;
  if p_points > 0 then
    update public.vip_customers set punti = coalesce(punti, 0) - p_points
      where id = v_customer.id;
  end if;
  v_applied := least(v_coupon.amount_cents, p_subtotal_cents);
  insert into public.vip_orders(customer_id, totale_prodotti, costo_consegna, stato)
    values(v_customer.id, (p_subtotal_cents - v_applied) / 100.0, p_delivery_cents / 100.0, 'pending')
    returning id::text into v_order_id;
  update public.llm_vouchers set used_at = clock_timestamp(), checkout_hash = p_hash,
    applied_cents = v_applied, order_id = v_order_id, points_debited = p_points
    where code = v_coupon.code;
  return jsonb_build_object('valido', true, 'used', true, 'orderId', v_order_id,
    'appliedCents', v_applied, 'valore', v_coupon.amount_cents / 100, 'pointsDebited', p_points);
end;
$checkout$;

alter table public.llm_wallets enable row level security;
alter table public.llm_actions enable row level security;
alter table public.llm_vouchers enable row level security;
revoke all on public.llm_wallets, public.llm_actions, public.llm_vouchers from public, anon, authenticated;
grant select, insert, update on public.llm_wallets, public.llm_actions, public.llm_vouchers to service_role;

revoke execute on function public.llm_state(text),
  public.llm_play(text,uuid,text,integer,jsonb,integer,integer,text),
  public.llm_checkout(text,text,text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.llm_state(text),
  public.llm_play(text,uuid,text,integer,jsonb,integer,integer,text),
  public.llm_checkout(text,text,text,text,integer,integer,integer) to service_role;
notify pgrst, 'reload schema';
commit;
