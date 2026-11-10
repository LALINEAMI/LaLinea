-- Test isolato. Non legge né modifica i clienti, i buoni o gli ordini del sito.
-- Eseguire tutto il file come singola query. ROLLBACK elimina anche lo schema di prova.
begin;
set local plpgsql.check_asserts = on;

create schema llm_collaudo_7f29;
create table llm_collaudo_7f29.vip_customers (
  id uuid primary key,
  punti integer not null check (punti >= 0)
);
create table llm_collaudo_7f29.vip_orders (
  id bigint generated always as identity primary key,
  customer_id uuid not null references llm_collaudo_7f29.vip_customers(id),
  totale_prodotti numeric not null,
  costo_consegna numeric not null,
  stato text not null
);

do $preflight$
begin
  if to_regclass('llm_collaudo_7f29.vip_customers') is null or to_regclass('llm_collaudo_7f29.vip_orders') is null then
    raise exception 'Progetto Supabase errato: mancano le tabelle VIP del sito.';
  end if;
  perform c.id, c.punti from llm_collaudo_7f29.vip_customers c where false;
  perform o.id, o.customer_id, o.totale_prodotti, o.costo_consegna, o.stato
    from llm_collaudo_7f29.vip_orders o where false;
end;
$preflight$;

create table if not exists llm_collaudo_7f29.llm_wallets (
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

create table if not exists llm_collaudo_7f29.llm_actions (
  customer_id text not null references llm_collaudo_7f29.llm_wallets(customer_id),
  request_id uuid not null,
  action text not null check (action in ('spin', 'bonus', 'redeem')),
  choice integer,
  outcome jsonb not null,
  created_at timestamptz not null,
  primary key (customer_id, request_id)
);

create index if not exists llm_spin_history_idx
  on llm_collaudo_7f29.llm_actions(customer_id, created_at desc)
  where action = 'spin';

create table if not exists llm_collaudo_7f29.llm_vouchers (
  code text primary key check (code ~ '^LLM-[A-F0-9]{24}$'),
  customer_id text not null references llm_collaudo_7f29.llm_wallets(customer_id),
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
  on llm_collaudo_7f29.llm_vouchers(customer_id, created_at desc);

create or replace function llm_collaudo_7f29.llm_state(p_customer_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $state$
declare
  v_points bigint;
  v_wallet llm_collaudo_7f29.llm_wallets%rowtype;
  v_history jsonb;
  v_vouchers jsonb;
begin
  select coalesce(c.punti, 0)::bigint into v_points
    from llm_collaudo_7f29.vip_customers c where c.id::text = p_customer_id;
  if not found then
    return jsonb_build_object('error', 'VIP_REQUIRED');
  end if;

  select * into v_wallet from llm_collaudo_7f29.llm_wallets where customer_id = p_customer_id;
  select coalesce(jsonb_agg(recent.outcome order by recent.created_at desc), '[]'::jsonb)
    into v_history
    from (
      select outcome, created_at from llm_collaudo_7f29.llm_actions
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
      select code, amount_cents, created_at, expires_at, used_at from llm_collaudo_7f29.llm_vouchers
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

create or replace function llm_collaudo_7f29.llm_play(
  p_customer_id text, p_request_id uuid, p_action text, p_choice integer,
  p_board jsonb, p_base_ll integer, p_bonus_roll integer, p_code text
)
returns jsonb language plpgsql security invoker set search_path = '' as $play$
declare
  v_customer llm_collaudo_7f29.vip_customers%rowtype;
  v_wallet llm_collaudo_7f29.llm_wallets%rowtype;
  v_previous llm_collaudo_7f29.llm_actions%rowtype;
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
  select * into v_customer from llm_collaudo_7f29.vip_customers
    where id::text = p_customer_id for update;
  if not found then
    return jsonb_build_object('error', 'VIP_REQUIRED');
  end if;

  select * into v_previous from llm_collaudo_7f29.llm_actions
    where customer_id = p_customer_id and request_id = p_request_id;
  if found then
    if v_previous.action <> p_action or v_previous.choice is distinct from p_choice then
      return jsonb_build_object('error', 'REQUEST_CONFLICT');
    end if;
    return jsonb_build_object('state', llm_collaudo_7f29.llm_state(p_customer_id), 'outcome', v_previous.outcome);
  end if;

  insert into llm_collaudo_7f29.llm_wallets(customer_id) values(p_customer_id) on conflict do nothing;
  select * into v_wallet from llm_collaudo_7f29.llm_wallets where customer_id = p_customer_id for update;
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
      return jsonb_build_object('error', 'TOO_FAST', 'state', llm_collaudo_7f29.llm_state(p_customer_id));
    end if;

    v_free := v_wallet.free_spins > 0;
    v_bet := case when v_free then 10 else p_choice end;
    v_debit := case when v_free then 0 else v_bet end;
    if v_debit > 0 and coalesce(v_customer.punti, 0) < v_debit then
      return jsonb_build_object('error', 'LOW_POINTS', 'state', llm_collaudo_7f29.llm_state(p_customer_id));
    end if;
    v_ll := p_base_ll * (v_bet / 5);
    if v_debit > 0 then
      update llm_collaudo_7f29.vip_customers set punti = coalesce(punti, 0) - v_debit
        where id = v_customer.id;
    end if;
    -- Si conta il tempo tra due giri confermati a non più di un minuto.
    if v_wallet.bonus_day is distinct from v_day
      and v_wallet.last_spin_at >= v_now - interval '60 seconds' then
      v_wallet.active_ms := least(1800000, v_wallet.active_ms
        + floor(extract(epoch from (v_now - v_wallet.last_spin_at)) * 1000)::integer);
    end if;
    update llm_collaudo_7f29.llm_wallets set
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
      return jsonb_build_object('error', 'BONUS_LOCKED', 'state', llm_collaudo_7f29.llm_state(p_customer_id));
    end if;
    v_extra := case when p_bonus_roll < 50 then 5 when p_bonus_roll < 85 then 10
      when p_bonus_roll < 99 then 15 else 0 end;
    if v_extra = 0 then v_prize := 5000; end if;
    update llm_collaudo_7f29.llm_wallets set active_ms = 0, bonus_day = v_day, free_spins = free_spins + v_extra,
      last_spin_at = null where customer_id = p_customer_id;
    v_outcome := jsonb_build_object('kind', 'bonus', 'spins', v_extra, 'euro', v_prize / 100);

  else
    if p_choice is not null then return jsonb_build_object('error', 'BAD_REQUEST'); end if;
    if v_wallet.ll < 1000 or v_wallet.spent - v_wallet.redemptions * 200 < 200 then
      return jsonb_build_object('error', 'REDEEM_LOCKED', 'state', llm_collaudo_7f29.llm_state(p_customer_id));
    end if;
    v_prize := 10000;
    update llm_collaudo_7f29.llm_wallets set ll = ll - 1000, redemptions = redemptions + 1
      where customer_id = p_customer_id;
    v_outcome := jsonb_build_object('kind', 'redeem', 'euro', 100);
  end if;

  if v_prize > 0 then
    if p_code is null or p_code !~ '^LLM-[A-F0-9]{24}$' then
      raise exception 'Formato buono La Milanese non valido.';
    end if;
    insert into llm_collaudo_7f29.llm_vouchers(code, customer_id, amount_cents, created_at, expires_at)
      values(p_code, p_customer_id, v_prize, v_now, v_now + interval '30 days');
    v_outcome := v_outcome || jsonb_build_object('code', p_code);
  end if;

  insert into llm_collaudo_7f29.llm_actions(customer_id, request_id, action, choice, outcome, created_at)
    values(p_customer_id, p_request_id, p_action, p_choice, v_outcome, v_now);
  return jsonb_build_object('state', llm_collaudo_7f29.llm_state(p_customer_id), 'outcome', v_outcome);
end;
$play$;

-- Controllo o utilizzo del buono. Un ordine pending e il consumo nascono insieme.
-- La stessa conferma può essere recuperata dopo un'interruzione di rete.
create or replace function llm_collaudo_7f29.llm_checkout(
  p_customer_id text, p_code text, p_mode text, p_hash text,
  p_subtotal_cents integer, p_delivery_cents integer, p_points integer
)
returns jsonb language plpgsql security invoker set search_path = '' as $checkout$
declare
  v_customer llm_collaudo_7f29.vip_customers%rowtype;
  v_coupon llm_collaudo_7f29.llm_vouchers%rowtype;
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
    select * into v_customer from llm_collaudo_7f29.vip_customers
      where id::text = p_customer_id for update;
    if not found then return jsonb_build_object('error', 'VIP_REQUIRED'); end if;
    select * into v_coupon from llm_collaudo_7f29.llm_vouchers
      where customer_id = p_customer_id and code = p_code for update;
  else
    select * into v_coupon from llm_collaudo_7f29.llm_vouchers
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
    update llm_collaudo_7f29.vip_customers set punti = coalesce(punti, 0) - p_points
      where id = v_customer.id;
  end if;
  v_applied := least(v_coupon.amount_cents, p_subtotal_cents);
  insert into llm_collaudo_7f29.vip_orders(customer_id, totale_prodotti, costo_consegna, stato)
    values(v_customer.id, (p_subtotal_cents - v_applied) / 100.0, p_delivery_cents / 100.0, 'pending')
    returning id::text into v_order_id;
  update llm_collaudo_7f29.llm_vouchers set used_at = clock_timestamp(), checkout_hash = p_hash,
    applied_cents = v_applied, order_id = v_order_id, points_debited = p_points
    where code = v_coupon.code;
  return jsonb_build_object('valido', true, 'used', true, 'orderId', v_order_id,
    'appliedCents', v_applied, 'valore', v_coupon.amount_cents / 100, 'pointsDebited', p_points);
end;
$checkout$;

alter table llm_collaudo_7f29.llm_wallets enable row level security;
alter table llm_collaudo_7f29.llm_actions enable row level security;
alter table llm_collaudo_7f29.llm_vouchers enable row level security;
revoke all on llm_collaudo_7f29.llm_wallets, llm_collaudo_7f29.llm_actions, llm_collaudo_7f29.llm_vouchers from public, anon, authenticated;
grant select, insert, update on llm_collaudo_7f29.llm_wallets, llm_collaudo_7f29.llm_actions, llm_collaudo_7f29.llm_vouchers to service_role;

revoke execute on function llm_collaudo_7f29.llm_state(text),
  llm_collaudo_7f29.llm_play(text,uuid,text,integer,jsonb,integer,integer,text),
  llm_collaudo_7f29.llm_checkout(text,text,text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function llm_collaudo_7f29.llm_state(text),
  llm_collaudo_7f29.llm_play(text,uuid,text,integer,jsonb,integer,integer,text),
  llm_collaudo_7f29.llm_checkout(text,text,text,text,integer,integer,integer) to service_role;

insert into llm_collaudo_7f29.vip_customers(id, punti)
values ('a0000000-0000-4000-8000-000000000001', 500), ('b0000000-0000-4000-8000-000000000002', 4);

do $test$
declare
  a constant text := 'a0000000-0000-4000-8000-000000000001';
  b constant text := 'b0000000-0000-4000-8000-000000000002';
  code100 constant text := 'LLM-AAAAAAAAAAAAAAAAAAAAAAAA';
  code50 constant text := 'LLM-BBBBBBBBBBBBBBBBBBBBBBBB';
  board constant jsonb := '[["rider","rider","rider"],["rider","rider","rider"],["rider","rider","rider"],["rider","rider","rider"],["rider","rider","rider"]]'::jsonb;
  first_id constant uuid := '10000000-0000-4000-8000-000000000001';
  redeem_id constant uuid := '10000000-0000-4000-8000-000000000002';
  first_bonus constant uuid := '10000000-0000-4000-8000-000000000003';
  r jsonb;
  order_receipt text;
  total_orders integer;
  saldo integer;
begin
  r := llm_collaudo_7f29.llm_play(b, gen_random_uuid(), 'spin', 5, board, 1200, null, null);
  assert (r->>'error') = 'LOW_POINTS', 'Puntata oltre saldo';
  assert (llm_collaudo_7f29.llm_state(b)->>'points')::integer = 4, 'Saldo intatto dopo rifiuto';

  r := llm_collaudo_7f29.llm_play(a, first_id, 'spin', 50, board, 1200, null, null);
  assert (r #>> '{state,points}')::integer = 450, 'Addebito da 50 punti';
  assert (r #>> '{outcome,amount}')::integer = 12000, 'Premio in LL';
  r := llm_collaudo_7f29.llm_play(a, first_id, 'spin', 50, board, 0, null, null);
  assert (r #>> '{outcome,amount}')::integer = 12000, 'Ripetizione restituisce la prima estrazione';
  assert (r #>> '{state,points}')::integer = 450, 'Nessun doppio addebito';
  r := llm_collaudo_7f29.llm_play(a, first_id, 'spin', 25, board, 0, null, null);
  assert (r->>'error') = 'REQUEST_CONFLICT', 'Non riutilizzare ID per puntata diversa';

  r := llm_collaudo_7f29.llm_play(a, gen_random_uuid(), 'redeem', null, null, null, null, code100);
  assert (r->>'error') = 'REDEEM_LOCKED', 'Soglia di 200 punti spesi';
  for i in 1..3 loop
    update llm_collaudo_7f29.llm_wallets
      set last_spin_at = clock_timestamp() - interval '3 seconds' where customer_id = a;
    r := llm_collaudo_7f29.llm_play(a, gen_random_uuid(), 'spin', 50, board, 1200, null, null);
    assert (r #>> '{outcome,debited}')::integer = 50, 'Tre giri pagati';
  end loop;
  r := llm_collaudo_7f29.llm_play(a, redeem_id, 'redeem', null, null, null, null, code100);
  assert (r #>> '{state,ll}')::integer = 47000, 'Riscatto scala 1.000 LL';
  assert (r #>> '{state,points}')::integer = 300, 'Riscatto non scala di nuovo i punti';
  assert (r #>> '{state,redemptions}')::integer = 1, 'Una quota di 200 punti conteggiata';
  assert (r #>> '{outcome,code}') = code100, 'Buono da 100 euro emesso';
  r := llm_collaudo_7f29.llm_play(a, redeem_id, 'redeem', null, null, null, null, code50);
  assert (r #>> '{outcome,code}') = code100, 'Stesso buono dopo risposta persa';

  r := llm_collaudo_7f29.llm_checkout(b, code100, 'validate', null, null, null, null);
  assert (r->>'error') = 'VOUCHER_NOT_FOUND', 'Buono personale';
  r := llm_collaudo_7f29.llm_checkout(a, code100, 'validate', null, null, null, null);
  assert (r->>'valore')::integer = 100, 'Buono valido nel carrello';
  r := llm_collaudo_7f29.llm_checkout(a, code100, 'consume', repeat('a', 64), 12000, 1000, 400);
  assert (r->>'error') = 'LOW_POINTS_ORDER', 'Un carrello respinto conserva il buono';
  r := llm_collaudo_7f29.llm_checkout(a, code100, 'consume', repeat('a', 64), 12000, 1000, 200);
  assert (r->>'appliedCents')::integer = 10000, '100 euro applicati ai prodotti';
  assert (r->>'pointsDebited')::integer = 200, 'Premi VIP scalati con lo stesso ordine';
  order_receipt := r->>'orderId';
  assert order_receipt is not null, 'Ricevuta ordine';
  r := llm_collaudo_7f29.llm_checkout(a, code100, 'consume', repeat('a', 64), 12000, 1000, 200);
  assert (r->>'orderId') = order_receipt, 'Riprova restituisce lo stesso ordine';
  select count(*) into total_orders from llm_collaudo_7f29.vip_orders;
  assert total_orders = 1, 'Un solo ordine in archivio';
  select punti into saldo from llm_collaudo_7f29.vip_customers where id::text = a;
  assert saldo = 100, 'Nessun doppio riscatto dei premi VIP';
  r := llm_collaudo_7f29.llm_checkout(a, code100, 'consume', repeat('b', 64), 13000, 1000, 0);
  assert (r->>'error') = 'VOUCHER_USED', 'Buono non riutilizzabile su un altro ordine';

  r := llm_collaudo_7f29.llm_play(a, first_bonus, 'bonus', 0, null, null, 1, null);
  assert (r->>'error') = 'BONUS_LOCKED', 'Bonus bloccato prima di 30 minuti';
  update llm_collaudo_7f29.llm_wallets set active_ms = 1750000,
    last_spin_at = clock_timestamp() - interval '55 seconds' where customer_id = a;
  r := llm_collaudo_7f29.llm_play(a, gen_random_uuid(), 'spin', 5, board, 1200, null, null);
  assert (r #>> '{state,activeMs}')::integer = 1800000, '30 minuti di gioco cumulativi';
  r := llm_collaudo_7f29.llm_play(a, first_bonus, 'bonus', 0, null, null, 1, null);
  assert (r #>> '{state,freeSpins}')::integer = 5, 'Bonus cinque giri gratuiti';
  r := llm_collaudo_7f29.llm_play(a, gen_random_uuid(), 'spin', 50, board, 1200, null, null);
  assert (r #>> '{outcome,bet}')::integer = 10, 'Giro extra a puntata 10';
  assert (r #>> '{outcome,debited}')::integer = 0, 'Giro extra gratuito';
  assert (r #>> '{state,points}')::integer = 95, 'Saldo dopo giro extra';

  update llm_collaudo_7f29.llm_wallets set active_ms = 1800000 where customer_id = a;
  r := llm_collaudo_7f29.llm_play(a, gen_random_uuid(), 'bonus', 1, null, null, 99, code50);
  assert (r->>'error') = 'BONUS_LOCKED', 'Un bonus al giorno';
  update llm_collaudo_7f29.llm_wallets set bonus_day = bonus_day - 1 where customer_id = a;
  r := llm_collaudo_7f29.llm_play(a, gen_random_uuid(), 'bonus', 1, null, null, 99, code50);
  assert (r #>> '{outcome,euro}')::integer = 50, 'Buono bonus da 50 euro';
  update llm_collaudo_7f29.llm_vouchers
    set created_at = now() - interval '40 days', expires_at = now() - interval '10 days'
    where code = code50;
  r := llm_collaudo_7f29.llm_checkout(a, code50, 'validate', null, null, null, null);
  assert (r->>'error') = 'VOUCHER_EXPIRED', 'Scadenza verificata nel carrello';

  assert not has_table_privilege('anon', 'llm_collaudo_7f29.llm_wallets', 'SELECT'), 'Saldo chiuso agli anonimi';
  assert not has_function_privilege('authenticated',
    'llm_collaudo_7f29.llm_play(text,uuid,text,integer,jsonb,integer,integer,text)', 'EXECUTE'),
    'Giro accessibile soltanto al server';
  raise notice 'Collaudo La Milanese OK. Saldi, giri, buoni e ordini di prova verranno annullati.';
end;
$test$;

rollback;
