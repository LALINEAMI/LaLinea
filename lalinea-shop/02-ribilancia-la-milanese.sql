-- Premi La Milanese. Richiede 01-attiva-la-milanese.sql già applicato.
-- Si può rieseguire. Saldi, buoni emessi e progressi restano nei conti esistenti.
begin;
set local lock_timeout = '5s';

do $preflight$
declare
  v_state regprocedure := to_regprocedure('public.llm_state(text)');
  v_play regprocedure := to_regprocedure('public.llm_play(text,uuid,text,integer,jsonb,integer,integer,text)');
begin
  if to_regclass('public.llm_wallets') is null or v_state is null or v_play is null then
    raise exception 'Attiva prima La Milanese con 01-attiva-la-milanese.sql nello stesso progetto.';
  end if;

  if (select md5(regexp_replace(prosrc, '[[:space:]]+', '', 'g'))
      from pg_catalog.pg_proc where oid = v_state)
    not in ('bd2f375342f5b3afe6acfa15859d9eea', 'ab1fbba3edfe9d800e2437842974f1bd')
    or (select md5(regexp_replace(prosrc, '[[:space:]]+', '', 'g'))
        from pg_catalog.pg_proc where oid = v_play)
    not in ('07a942c23588610e1b3dc70a317ee907', 'a535d0fe533fd412d8d0a3b7d7e3cdb5') then
    raise exception 'Versione della slot diversa da quella prevista. Aggiornamento interrotto.';
  end if;
end;
$preflight$;

-- Il contatore riscatti esistente attribuisce già 200 punti a ciascun buono.
-- La nuova colonna aggiunge solo la differenza per i riscatti da oggi.
alter table public.llm_wallets
  add column if not exists redeem_extra_points_used bigint not null default 0;

do $quota$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.llm_wallets'::regclass
      and conname = 'llm_wallets_redeem_extra_points_used_check'
  ) then
    alter table public.llm_wallets
      add constraint llm_wallets_redeem_extra_points_used_check
      check (redeem_extra_points_used between 0 and spent - redemptions * 200);
  end if;
end;
$quota$;

create or replace function public.llm_reward_rules()
returns table (ll_required integer, points_required integer)
language sql immutable security invoker set search_path = '' as $rules$
  select 8000, 6000
$rules$;

create or replace function public.llm_state(p_customer_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $state$
declare
  v_points bigint;
  v_wallet public.llm_wallets%rowtype;
  v_history jsonb;
  v_vouchers jsonb;
  v_rules record;
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

  select * into v_rules from public.llm_reward_rules();
  return jsonb_build_object(
    'points', v_points, 'll', coalesce(v_wallet.ll, 0),
    'redemption', jsonb_build_object(
      'll', v_rules.ll_required, 'points', v_rules.points_required,
      'available', coalesce(v_wallet.spent - v_wallet.redemptions * 200
        - v_wallet.redeem_extra_points_used, 0)
    ),
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
  v_rules record;
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
    select * into v_rules from public.llm_reward_rules();
    if v_wallet.ll < v_rules.ll_required
      or v_wallet.spent - v_wallet.redemptions * 200
        - v_wallet.redeem_extra_points_used < v_rules.points_required then
      return jsonb_build_object('error', 'REDEEM_LOCKED', 'state', public.llm_state(p_customer_id));
    end if;
    v_prize := 10000;
    update public.llm_wallets set
      ll = ll - v_rules.ll_required,
      redemptions = redemptions + 1,
      redeem_extra_points_used = redeem_extra_points_used + (v_rules.points_required - 200)
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

revoke execute on function public.llm_reward_rules(),
  public.llm_state(text),
  public.llm_play(text,uuid,text,integer,jsonb,integer,integer,text)
  from public, anon, authenticated;
grant execute on function public.llm_reward_rules(),
  public.llm_state(text),
  public.llm_play(text,uuid,text,integer,jsonb,integer,integer,text)
  to service_role;

notify pgrst, 'reload schema';
commit;

select ll_required as soldi_lalinea, points_required as punti_vip_puntati
  from public.llm_reward_rules();
