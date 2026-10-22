-- LALINEA_LEADERBOARD_V1
-- Classifica di sole partite verificate. Nessuna modifica a saldi o partite.
begin;

do $$
begin
  if to_regclass('public.llg_rewards') is null then
    raise exception 'Prima attiva il collegamento VIP del gioco con ATTIVA-BUONI-LALINEA.sql.';
  end if;
end;
$$;

create or replace function public.llg_leaderboard(p_customer_id text default null, p_limit integer default 100)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with scores as (
    select customer_id,
      max(level)::integer as highest_level,
      count(*)::integer as completed_levels,
      sum(coins)::bigint as total_coins,
      max(created_at) as reached_at
    from public.llg_rewards
    group by customer_id
  ), ranked as (
    select *, row_number() over (
      order by highest_level desc, total_coins desc, reached_at asc, customer_id asc
    ) as position
    from scores
  ), formatted as (
    select customer_id, position, jsonb_build_object(
      'customerId', customer_id,
      'position', position,
      'highestLevel', highest_level,
      'completedLevels', completed_levels,
      'totalCoins', total_coins
    ) as entry
    from ranked
  )
  select jsonb_build_object(
    'totalPlayers', (select count(*) from scores),
    'entries', coalesce((
      select jsonb_agg(top_entries.entry order by top_entries.position)
      from (
        select entry, position from formatted
        order by position
        limit greatest(1, least(coalesce(p_limit, 100), 100))
      ) as top_entries
    ), '[]'::jsonb),
    'own', (select entry from formatted where customer_id = p_customer_id)
  );
$$;

-- Accesso solo dal server del sito. Gli ID interni non escono dall'API.
revoke execute on function public.llg_leaderboard(text,integer) from public, anon, authenticated;
grant execute on function public.llg_leaderboard(text,integer) to service_role;
notify pgrst, 'reload schema';
commit;
