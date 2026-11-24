-- Aggiornamento del Calendario VIP LaLinea 2026 già installato.
-- Incolla questo file in una nuova query del SQL Editor di Supabase ed eseguila.
begin;

alter table public.ll_avv26_aperture
  drop constraint if exists ll_avv26_aperture_giorno_check,
  add constraint ll_avv26_aperture_giorno_check check (
    giorno = date '2026-11-24' or giorno between date '2026-12-01' and date '2026-12-25'
  );

create or replace function public.ll_avv26_calendario(
  p_cliente text, p_giorno date default null, p_biglietto integer default null, p_base integer default null
) returns jsonb language plpgsql security invoker set search_path = '' as $avv$
declare
  giorno_benvenuto constant date := date '2026-11-24';
  inizio_dicembre constant date := date '2026-12-01';
  fine_dicembre constant date := date '2026-12-25';
  benvenuto boolean;
  ora timestamptz;
  oggi date;
  n integer;
  ultima timestamptz;
  alto integer;
  premio record;
  storico jsonb;
  avviso text;
begin
  if p_cliente is null or not exists(select 1 from public.vip_customers c where c.id::text = p_cliente) then
    raise exception 'LLG_CUSTOMER_NOT_FOUND';
  end if;
  if p_giorno is not null then
    perform pg_advisory_xact_lock(20261225, 71);
  end if;
  ora := clock_timestamp();
  oggi := (ora at time zone 'Europe/Rome')::date;
  benvenuto := oggi = giorno_benvenuto;
  -- Il benvenuto usa la quota e i tagli piccoli di una sola giornata.
  n := case when benvenuto then 1 else extract(day from oggi)::integer end;
  select max(a.aperta_il) into ultima from public.ll_avv26_aperture a
    where a.cliente = p_cliente and a.giorno between inizio_dicembre and fine_dicembre;

  if p_giorno = oggi
    and (benvenuto or (oggi between inizio_dicembre and fine_dicembre
      and (ultima is null or ora >= ultima + interval '24 hours')))
    and not exists(select 1 from public.ll_avv26_aperture a where a.cliente = p_cliente and a.giorno = oggi) then
    if p_biglietto is null or p_biglietto not between 0 and 9999 or p_base is null or p_base not between 0 and 9999 then
      raise exception 'Estrazione non valida';
    end if;
    -- I dati reali del pannello determinano attivazione, valore, scadenza e disponibilità.
    perform d.codice from public.discount_codes d join public.ll_avv26_regole r on r.codice = d.codice order by d.codice for share of d;
    if not benvenuto and not exists(select 1 from public.discount_codes d join public.ll_avv26_regole r on r.codice=d.codice
      where d.tipo='fisso' and d.valore=r.euro and d.attivo and r.dal <= n
        and (d.scadenza is null or d.scadenza::date >= oggi)) then
      avviso := 'I buoni del calendario sono in preparazione. Potrai riprovare.';
    else
      -- 0,2% per 50 €, 0,8% per 30 €, 2% per 20 €, 4% per 15 €.
      alto := case when p_biglietto < 20 then 50 when p_biglietto < 100 then 30
                   when p_biglietto < 300 then 20 when p_biglietto < 700 then 15 end;
      with conteggi as (
        select a.codice_base, count(*) as assegnati,
          count(*) filter (where not a.riscattata) as prenotati,
          count(*) filter (where a.giorno=oggi) as odierni,
          count(*) filter (where (benvenuto and a.giorno=giorno_benvenuto)
            or (not benvenuto and a.giorno between inizio_dicembre and fine_dicembre)) as assegnati_periodo
        from public.ll_avv26_aperture a where a.codice_base is not null group by a.codice_base
      ), disponibili as (
        select r.* from public.ll_avv26_regole r join public.discount_codes d on d.codice=r.codice
        left join conteggi c on c.codice_base=r.codice
        where r.dal <= n and d.attivo and d.tipo='fisso' and d.valore=r.euro
          and (d.scadenza is null or d.scadenza::date >= oggi)
          and coalesce(c.assegnati,0) < r.tetto
          and coalesce(d.utilizzi,0)+coalesce(c.prenotati,0) < least(r.tetto,coalesce(d.max_utilizzi,r.tetto))
          and (r.peso_base=0 or coalesce(c.assegnati_periodo,0)<floor(r.tetto*n/25.0))
          and (r.limite_giorno=0 or coalesce(c.odierni,0)<r.limite_giorno)
          and (r.euro<>50 or not exists(select 1 from public.ll_avv26_aperture a where a.cliente=p_cliente and a.euro=50))
      ), base as (
        select d.*, sum(peso_base) over(order by euro) as cumulato, sum(peso_base) over() as totale
        from disponibili d where peso_base>0
      ), candidati as (
        select codice, euro, 0 as ordine from disponibili where euro=alto
        union all
        select codice, euro, 1 from base where p_base*totale < cumulato*10000
      )
      select codice,euro into premio from candidati order by ordine,euro limit 1;
      -- Un taglio piccolo esaurito non viene promosso a un taglio più caro.
      insert into public.ll_avv26_aperture(cliente,giorno,aperta_il,codice_base,euro)
        values(p_cliente,oggi,ora,premio.codice,coalesce(premio.euro,0));
      if premio.codice is not null then
        insert into public.ll_avv26_buoni(cliente,giorno,centesimi) values(p_cliente,oggi,premio.euro*100);
      end if;
      if not benvenuto then
        ultima := ora;
      end if;
    end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'day',a.giorno,'amount',a.euro,'credit',b.centesimi,'voucher',b.codice,
    'redeemed',a.riscattata,'expiry',d.scadenza,'active', coalesce(d.attivo,false)
      and d.tipo='fisso' and d.valore=a.euro and (d.scadenza is null or d.scadenza::date >= oggi)
  ) order by a.giorno desc),'[]'::jsonb) into storico
  from public.ll_avv26_aperture a left join public.ll_avv26_buoni b
    on b.cliente=a.cliente and b.giorno=a.giorno and b.ordine is null
  left join public.discount_codes d on d.codice=a.codice_base where a.cliente=p_cliente;
  return jsonb_build_object('today',oggi,'now',ora,'welcomeDay',giorno_benvenuto,
    'next',ultima+interval '24 hours','entries',storico,'notice',avviso);
end;
$avv$;

revoke all on function public.ll_avv26_calendario(text,date,integer,integer) from public, anon, authenticated;
grant execute on function public.ll_avv26_calendario(text,date,integer,integer) to service_role;
notify pgrst, 'reload schema';
commit;

select 'Benvenuto del 24 novembre pronto' as risultato;
