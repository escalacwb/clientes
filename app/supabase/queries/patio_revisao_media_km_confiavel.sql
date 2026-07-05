alter table public.patio_veiculos_snapshot
add column if not exists media_km_confianca text,
add column if not exists media_km_visitas_usadas integer,
add column if not exists media_km_visitas_descartadas integer,
add column if not exists media_km_recalculada_em timestamptz,
add column if not exists media_km_motivo text;

create index if not exists idx_patio_atendimentos_media_km_veiculo_data
on public.patio_atendimentos (patio_veiculo_id, status, fim_execucao, inicio_execucao, quilometragem)
where patio_veiculo_id is not null and status = 'finalizado' and quilometragem is not null;

create or replace function public.recalcular_media_km_patio_veiculo(p_patio_veiculo_id bigint)
returns table (
  patio_veiculo_id bigint,
  media_km_diaria numeric,
  confianca text,
  visitas_usadas integer,
  visitas_descartadas integer,
  motivo text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media numeric;
  v_confianca text;
  v_visitas_usadas integer;
  v_visitas_descartadas integer;
  v_periodo_meses integer;
  v_intervalos_validos integer;
  v_intervalos_invalidos integer;
  v_dias_conflitantes integer;
  v_visitas_validas integer;
  v_motivo text;
begin
  with visitas_raw as (
    select
      coalesce(pa.fim_execucao, pa.inicio_execucao)::date as data_visita,
      max(pa.quilometragem) as km_max,
      min(pa.quilometragem) as km_min,
      count(*)::integer as execucoes,
      count(distinct pa.quilometragem)::integer as kms_distintos
    from public.patio_atendimentos pa
    where pa.patio_veiculo_id = p_patio_veiculo_id
      and pa.status = 'finalizado'
      and pa.quilometragem is not null
      and pa.quilometragem > 0
      and coalesce(pa.fim_execucao, pa.inicio_execucao) is not null
      and coalesce(pa.fim_execucao, pa.inicio_execucao)::date >= current_date - interval '24 months'
    group by coalesce(pa.fim_execucao, pa.inicio_execucao)::date
  ),
  visitas_normalizadas as (
    select
      data_visita,
      km_max::integer as quilometragem,
      execucoes,
      kms_distintos,
      case
        when km_max > 2000000 then true
        when kms_distintos > 1 and (km_max - km_min) > greatest(500, round(km_max * 0.02)) then true
        else false
      end as visita_suspeita,
      case
        when data_visita >= current_date - interval '12 months' then true
        else false
      end as periodo_12m
    from visitas_raw
  ),
  periodo as (
    select
      case
        when count(*) filter (where periodo_12m and not visita_suspeita) >= 2 then 12
        else 24
      end as meses
    from visitas_normalizadas
  ),
  visitas_periodo as (
    select v.*
    from visitas_normalizadas v
    cross join periodo p
    where v.data_visita >= current_date - make_interval(months => p.meses)
  ),
  visitas_validas as (
    select *
    from visitas_periodo
    where not visita_suspeita
  ),
  ordenadas as (
    select
      v.*,
      lag(v.data_visita) over (order by v.data_visita) as data_anterior,
      lag(v.quilometragem) over (order by v.data_visita) as km_anterior
    from visitas_validas v
  ),
  trechos as (
    select
      data_visita,
      quilometragem,
      data_anterior,
      km_anterior,
      greatest(0, data_visita - data_anterior)::integer as dias,
      (quilometragem - km_anterior)::numeric as delta_km,
      case
        when data_anterior is null then null
        when greatest(0, data_visita - data_anterior) = 0 then null
        else (quilometragem - km_anterior)::numeric / greatest(1, data_visita - data_anterior)::numeric
      end as km_por_dia
    from ordenadas
    where data_anterior is not null
  ),
  trechos_classificados as (
    select
      *,
      case
        when dias <= 0 or delta_km <= 0 then false
        when dias = 1 and km_por_dia <= 1200 then true
        when dias between 2 and 3 and km_por_dia <= 1500 then true
        when dias >= 4 and km_por_dia <= 1800 then true
        else false
      end as trecho_valido,
      case
        when dias = 1 then 0.35
        when dias between 2 and 3 then 0.65
        when km_por_dia > 1000 then 0.70
        else 1.00
      end::numeric as peso
    from trechos
  ),
  validos as (
    select *
    from trechos_classificados
    where trecho_valido
  ),
  estatisticas as (
    select
      (select meses from periodo) as periodo_meses,
      (select count(*)::integer from visitas_periodo) as visitas_periodo,
      (select count(*)::integer from visitas_validas) as visitas_validas,
      (select count(*)::integer from visitas_periodo where visita_suspeita) as visitas_suspeitas,
      (select count(*)::integer from visitas_periodo where kms_distintos > 1) as dias_com_multiplos_kms,
      (select count(*)::integer from trechos_classificados where not trecho_valido) as intervalos_invalidos,
      count(*)::integer as intervalos_validos,
      percentile_cont(0.5) within group (order by km_por_dia)::numeric as mediana_km_dia,
      (sum(km_por_dia * peso) / nullif(sum(peso), 0))::numeric as media_ponderada_km_dia
    from validos
  )
  select
    case
      when e.intervalos_validos = 0 then null
      when e.intervalos_validos >= 3 then round((e.mediana_km_dia * 0.70) + (e.media_ponderada_km_dia * 0.30), 2)
      else round(e.media_ponderada_km_dia, 2)
    end,
    e.periodo_meses,
    case when e.intervalos_validos > 0 then e.intervalos_validos + 1 else 0 end,
    greatest(0, e.visitas_periodo - case when e.intervalos_validos > 0 then e.intervalos_validos + 1 else 0 end),
    e.intervalos_validos,
    e.intervalos_invalidos,
    e.dias_com_multiplos_kms,
    e.visitas_validas
  into
    v_media,
    v_periodo_meses,
    v_visitas_usadas,
    v_visitas_descartadas,
    v_intervalos_validos,
    v_intervalos_invalidos,
    v_dias_conflitantes,
    v_visitas_validas
  from estatisticas e;

  if v_intervalos_validos is null then
    v_intervalos_validos := 0;
  end if;
  if v_intervalos_invalidos is null then
    v_intervalos_invalidos := 0;
  end if;
  if v_dias_conflitantes is null then
    v_dias_conflitantes := 0;
  end if;
  if v_visitas_usadas is null then
    v_visitas_usadas := 0;
  end if;
  if v_visitas_descartadas is null then
    v_visitas_descartadas := 0;
  end if;
  if v_periodo_meses is null then
    v_periodo_meses := 24;
  end if;

  v_confianca := case
    when v_media is null then 'sem_media'
    when v_media > 1800 then 'suspeita'
    when v_intervalos_validos >= 3 and v_periodo_meses = 12 and v_media <= 1000 and v_intervalos_invalidos = 0 and v_dias_conflitantes = 0 then 'alta'
    when v_intervalos_validos >= 2 and v_media <= 1200 then 'media'
    when v_intervalos_validos >= 3 and v_media <= 1800 then 'media'
    when v_intervalos_validos >= 1 and v_media <= 1200 then 'baixa'
    else 'suspeita'
  end;

  v_motivo := concat_ws(
    '; ',
    'periodo ' || v_periodo_meses::text || 'm',
    'trechos validos ' || v_intervalos_validos::text,
    case when v_intervalos_invalidos > 0 then 'trechos descartados ' || v_intervalos_invalidos::text end,
    case when v_dias_conflitantes > 0 then 'dias com KM conflitante ' || v_dias_conflitantes::text end,
    case when v_media is null then 'historico insuficiente ou invalido' end,
    case when v_media > 1800 then 'media acima do limite automatico' end
  );

  update public.patio_veiculos_snapshot pvs
  set media_km_diaria = case when v_confianca in ('suspeita', 'sem_media') then null else v_media end,
      media_km_confianca = v_confianca,
      media_km_visitas_usadas = v_visitas_usadas,
      media_km_visitas_descartadas = v_visitas_descartadas,
      media_km_recalculada_em = now(),
      media_km_motivo = v_motivo,
      raw_data = coalesce(pvs.raw_data, '{}'::jsonb) || jsonb_build_object(
        'media_km_origem', 'supabase_crm',
        'media_km_calculada', v_media,
        'media_km_confianca', v_confianca,
        'media_km_periodo_meses', v_periodo_meses,
        'media_km_trechos_validos', v_intervalos_validos,
        'media_km_trechos_descartados', v_intervalos_invalidos,
        'media_km_dias_conflitantes', v_dias_conflitantes,
        'media_km_recalculada_em', now()
      ),
      sincronizado_em = now()
  where pvs.patio_veiculo_id = p_patio_veiculo_id;

  return query
  select
    p_patio_veiculo_id,
    case when v_confianca in ('suspeita', 'sem_media') then null else v_media end,
    v_confianca,
    v_visitas_usadas,
    v_visitas_descartadas,
    v_motivo;
end;
$$;

create or replace function public.recalcular_medias_km_patio(
  p_limit integer default null
)
returns table (
  processados integer,
  com_media integer,
  sem_media integer,
  suspeitos integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_result record;
  v_processados integer := 0;
  v_com_media integer := 0;
  v_sem_media integer := 0;
  v_suspeitos integer := 0;
begin
  if auth.uid() is not null and auth.role() <> 'service_role' and not public.current_user_is_admin() then
    raise exception 'Apenas admin pode recalcular medias de KM em lote.';
  end if;

  for v_id in
    select pvs.patio_veiculo_id
    from public.patio_veiculos_snapshot pvs
    where exists (
      select 1
      from public.patio_atendimentos pa
      where pa.patio_veiculo_id = pvs.patio_veiculo_id
        and pa.status = 'finalizado'
        and pa.quilometragem is not null
        and pa.quilometragem > 0
    )
    order by pvs.patio_veiculo_id
    limit case when p_limit is not null and p_limit > 0 then p_limit else null end
  loop
    select *
    into v_result
    from public.recalcular_media_km_patio_veiculo(v_id);

    v_processados := v_processados + 1;
    if v_result.confianca in ('alta', 'media', 'baixa') and v_result.media_km_diaria is not null then
      v_com_media := v_com_media + 1;
    elsif v_result.confianca = 'suspeita' then
      v_suspeitos := v_suspeitos + 1;
    else
      v_sem_media := v_sem_media + 1;
    end if;
  end loop;

  return query select v_processados, v_com_media, v_sem_media, v_suspeitos;
end;
$$;

create or replace function public.recalcular_media_km_patio_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patio_veiculo_id bigint;
begin
  v_patio_veiculo_id := coalesce(new.patio_veiculo_id, old.patio_veiculo_id);

  if v_patio_veiculo_id is null then
    return new;
  end if;

  if tg_op = 'INSERT'
     or new.status is distinct from old.status
     or new.quilometragem is distinct from old.quilometragem
     or new.fim_execucao is distinct from old.fim_execucao
     or new.inicio_execucao is distinct from old.inicio_execucao
     or new.patio_veiculo_id is distinct from old.patio_veiculo_id then
    perform public.recalcular_media_km_patio_veiculo(v_patio_veiculo_id);
  end if;

  if tg_op = 'UPDATE' and old.patio_veiculo_id is not null and old.patio_veiculo_id is distinct from new.patio_veiculo_id then
    perform public.recalcular_media_km_patio_veiculo(old.patio_veiculo_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_recalcular_media_km_patio on public.patio_atendimentos;
create trigger trg_recalcular_media_km_patio
after insert or update of status, quilometragem, fim_execucao, inicio_execucao, patio_veiculo_id
on public.patio_atendimentos
for each row
when (new.patio_veiculo_id is not null)
execute function public.recalcular_media_km_patio_trigger();

grant execute on function public.recalcular_media_km_patio_veiculo(bigint) to authenticated, service_role;
grant execute on function public.recalcular_medias_km_patio(integer) to authenticated, service_role;
