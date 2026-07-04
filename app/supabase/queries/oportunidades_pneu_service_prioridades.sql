create or replace view public.vw_service_visitas_risco
with (security_invoker = true) as
with params as (
  select current_date as data_ref
),
visitas as (
  select distinct
    om.cliente_id,
    om.data_movimento::date as data_visita,
    coalesce(nullif(om.pedido, ''), nullif(om.nota, ''), om.id::text) as os_key,
    nullif(upper(regexp_replace(coalesce(om.placa_extraida, ''), '[^A-Z0-9]', '', 'g')), '') as placa
  from public.ordens_movimento om
  cross join params p
  where om.tipo = 'servico'
    and om.cliente_id is not null
    and om.data_movimento is not null
    and om.data_movimento >= p.data_ref - interval '24 months'
    and om.data_movimento < p.data_ref + 1
),
servicos_alinhamento as (
  select
    si.cliente_id,
    si.data_servico::date as data_servico,
    count(*)::integer as servicos
  from public.servicos_itens si
  cross join params p
  where si.cliente_id is not null
    and si.data_servico >= p.data_ref - interval '24 months'
    and si.data_servico < p.data_ref + 1
    and (
      unaccent(coalesce(si.servico_nome, '')) ilike unaccent('%ALINH%')
      or unaccent(coalesce(si.servico_nome, '')) ilike unaccent('%BALANC%')
      or unaccent(coalesce(si.servico_nome, '')) ilike unaccent('%GEOMET%')
      or unaccent(coalesce(si.servico_nome, '')) ilike unaccent('%CAMBAG%')
      or unaccent(coalesce(si.servico_nome, '')) ilike unaccent('%CASTER%')
    )
  group by si.cliente_id, si.data_servico
),
cliente_base as (
  select
    v.cliente_id,
    count(*) filter (where v.data_visita >= p.data_ref - interval '12 months')::integer as visitas_12m,
    count(*)::integer as visitas_24m,
    min(v.data_visita) as primeira_visita_24m,
    max(v.data_visita) as ultima_visita,
    count(distinct v.placa) filter (
      where v.placa is not null
        and v.data_visita >= p.data_ref - interval '12 months'
    )::integer as placas_12m,
    (p.data_ref - max(v.data_visita))::integer as dias_sem_visita
  from visitas v
  cross join params p
  group by v.cliente_id, p.data_ref
),
intervalos as (
  select
    cliente_id,
    percentile_cont(0.5) within group (order by intervalo)::numeric(10, 2) as intervalo_mediano_dias
  from (
    select
      cliente_id,
      data_visita - lag(data_visita) over (partition by cliente_id order by data_visita) as intervalo
    from (
      select distinct cliente_id, data_visita
      from visitas
    ) d
  ) x
  where intervalo is not null
    and intervalo > 0
  group by cliente_id
),
janelas30 as (
  select
    cb.cliente_id,
    gs.n,
    count(v.*)::integer as visitas,
    count(distinct v.placa) filter (where v.placa is not null)::integer as placas,
    coalesce(sum(sa.servicos), 0)::integer as alinhamentos
  from cliente_base cb
  cross join params p
  cross join generate_series(1, 11) as gs(n)
  left join visitas v
    on v.cliente_id = cb.cliente_id
   and v.data_visita >= p.data_ref - (gs.n + 1) * interval '30 days'
   and v.data_visita < p.data_ref - gs.n * interval '30 days'
  left join servicos_alinhamento sa
    on sa.cliente_id = cb.cliente_id
   and sa.data_servico >= p.data_ref - (gs.n + 1) * interval '30 days'
   and sa.data_servico < p.data_ref - gs.n * interval '30 days'
  group by cb.cliente_id, gs.n
),
stats30 as (
  select
    cliente_id,
    percentile_cont(0.5) within group (order by visitas)::numeric(10, 2) as visitas_mediana30,
    percentile_cont(0.25) within group (order by visitas)::numeric(10, 2) as visitas_p25_30,
    percentile_cont(0.5) within group (order by placas)::numeric(10, 2) as placas_mediana30,
    percentile_cont(0.25) within group (order by placas)::numeric(10, 2) as placas_p25_30,
    percentile_cont(0.5) within group (order by alinhamentos)::numeric(10, 2) as alinhamentos_mediana30,
    percentile_cont(0.25) within group (order by alinhamentos)::numeric(10, 2) as alinhamentos_p25_30,
    count(*) filter (where visitas > 0)::integer as janelas30_com_visita
  from janelas30
  group by cliente_id
),
janelas60 as (
  select
    cb.cliente_id,
    gs.n,
    count(v.*)::integer as visitas,
    count(distinct v.placa) filter (where v.placa is not null)::integer as placas,
    coalesce(sum(sa.servicos), 0)::integer as alinhamentos
  from cliente_base cb
  cross join params p
  cross join generate_series(1, 5) as gs(n)
  left join visitas v
    on v.cliente_id = cb.cliente_id
   and v.data_visita >= p.data_ref - (gs.n + 1) * interval '60 days'
   and v.data_visita < p.data_ref - gs.n * interval '60 days'
  left join servicos_alinhamento sa
    on sa.cliente_id = cb.cliente_id
   and sa.data_servico >= p.data_ref - (gs.n + 1) * interval '60 days'
   and sa.data_servico < p.data_ref - gs.n * interval '60 days'
  group by cb.cliente_id, gs.n
),
stats60 as (
  select
    cliente_id,
    percentile_cont(0.5) within group (order by visitas)::numeric(10, 2) as visitas_mediana60,
    percentile_cont(0.25) within group (order by visitas)::numeric(10, 2) as visitas_p25_60,
    percentile_cont(0.5) within group (order by placas)::numeric(10, 2) as placas_mediana60,
    percentile_cont(0.25) within group (order by placas)::numeric(10, 2) as placas_p25_60,
    percentile_cont(0.5) within group (order by alinhamentos)::numeric(10, 2) as alinhamentos_mediana60,
    percentile_cont(0.25) within group (order by alinhamentos)::numeric(10, 2) as alinhamentos_p25_60,
    count(*) filter (where visitas > 0)::integer as janelas60_com_visita
  from janelas60
  group by cliente_id
),
recentes as (
  select
    cb.cliente_id,
    count(v.*) filter (where v.data_visita >= p.data_ref - interval '30 days')::integer as visitas30,
    count(v.*) filter (where v.data_visita >= p.data_ref - interval '60 days')::integer as visitas60,
    count(distinct v.placa) filter (
      where v.placa is not null
        and v.data_visita >= p.data_ref - interval '30 days'
    )::integer as placas30,
    count(distinct v.placa) filter (
      where v.placa is not null
        and v.data_visita >= p.data_ref - interval '60 days'
    )::integer as placas60,
    coalesce(sum(sa.servicos) filter (where sa.data_servico >= p.data_ref - interval '30 days'), 0)::integer as alinhamentos30,
    coalesce(sum(sa.servicos) filter (where sa.data_servico >= p.data_ref - interval '60 days'), 0)::integer as alinhamentos60
  from cliente_base cb
  cross join params p
  left join visitas v
    on v.cliente_id = cb.cliente_id
   and v.data_visita >= p.data_ref - interval '60 days'
  left join servicos_alinhamento sa
    on sa.cliente_id = cb.cliente_id
   and sa.data_servico >= p.data_ref - interval '60 days'
  group by cb.cliente_id
),
classificado as (
  select
    cb.cliente_id,
    c.nome as cliente_nome,
    c.vendedor_id,
    c.status_comercial,
    cb.visitas_12m,
    cb.visitas_24m,
    cb.placas_12m,
    cb.ultima_visita,
    cb.dias_sem_visita,
    i.intervalo_mediano_dias,
    r.visitas30,
    r.visitas60,
    r.placas30,
    r.placas60,
    r.alinhamentos30,
    r.alinhamentos60,
    s30.visitas_mediana30,
    s30.visitas_p25_30,
    s30.placas_mediana30,
    s30.placas_p25_30,
    s30.alinhamentos_mediana30,
    s30.alinhamentos_p25_30,
    s30.janelas30_com_visita,
    s60.visitas_mediana60,
    s60.visitas_p25_60,
    s60.placas_mediana60,
    s60.placas_p25_60,
    s60.alinhamentos_mediana60,
    s60.alinhamentos_p25_60,
    s60.janelas60_com_visita,
    case
      when cb.visitas_12m >= 12
        and s30.visitas_mediana30 >= 3
        and s30.janelas30_com_visita >= 5
        then 'forte'
      when cb.visitas_12m >= 4
        and s60.visitas_mediana60 >= 2
        and s60.janelas60_com_visita >= 2
        then 'medio'
      when cb.visitas_24m >= 4
        and cb.visitas_12m >= 2
        then 'esporadico'
      else 'fora_regra'
    end as recorrencia
  from cliente_base cb
  join public.clientes c on c.id = cb.cliente_id
  left join intervalos i on i.cliente_id = cb.cliente_id
  left join recentes r on r.cliente_id = cb.cliente_id
  left join stats30 s30 on s30.cliente_id = cb.cliente_id
  left join stats60 s60 on s60.cliente_id = cb.cliente_id
  where c.excluido_em is null
),
alertas as (
  select
    *,
    case
      when recorrencia = 'forte'
        and visitas30 < visitas_mediana30 * 0.70
        and visitas30 < visitas_p25_30
        and dias_sem_visita >= 7
        then 'queda_visitas_30d'
      when recorrencia = 'medio'
        and visitas60 < visitas_mediana60 * 0.70
        and visitas60 < visitas_p25_60
        and dias_sem_visita >= 14
        then 'queda_visitas_60d'
      when recorrencia = 'esporadico'
        and intervalo_mediano_dias is not null
        and dias_sem_visita > greatest(60, round(intervalo_mediano_dias * 3.0)::integer)
        then 'atraso_intervalo_normal'
      when recorrencia = 'forte'
        and placas_p25_30 >= 2
        and visitas30 >= visitas_mediana30 * 0.70
        and placas30 < placas_mediana30 * 0.70
        and placas30 < placas_p25_30
        then 'queda_placas_30d'
      when recorrencia = 'medio'
        and placas_p25_60 >= 2
        and visitas60 >= visitas_mediana60 * 0.70
        and placas60 < placas_mediana60 * 0.70
        and placas60 < placas_p25_60
        then 'queda_placas_60d'
      when recorrencia = 'forte'
        and alinhamentos_p25_30 >= 1
        and visitas30 >= visitas_mediana30 * 0.70
        and alinhamentos30 < alinhamentos_mediana30 * 0.70
        and alinhamentos30 < alinhamentos_p25_30
        then 'queda_alinhamento_balanceamento_30d'
      when recorrencia = 'medio'
        and alinhamentos_p25_60 >= 1
        and visitas60 >= visitas_mediana60 * 0.70
        and alinhamentos60 < alinhamentos_mediana60 * 0.70
        and alinhamentos60 < alinhamentos_p25_60
        then 'queda_alinhamento_balanceamento_60d'
      else null
    end as alerta
  from classificado
  where recorrencia <> 'fora_regra'
),
ranked as (
  select
    *,
    row_number() over (
      partition by cliente_id
      order by case alerta
        when 'queda_visitas_30d' then 10
        when 'queda_visitas_60d' then 9
        when 'atraso_intervalo_normal' then 8
        when 'queda_placas_30d' then 7
        when 'queda_placas_60d' then 6
        when 'queda_alinhamento_balanceamento_30d' then 5
        when 'queda_alinhamento_balanceamento_60d' then 4
        else 0
      end desc
    ) as rn
  from alertas
  where alerta is not null
)
select
  cliente_id,
  cliente_nome,
  vendedor_id,
  case
    when alerta like 'queda_alinhamento_balanceamento%' then 'service_mix_caiu'
    else 'service_risco_visitas'
  end as tipo,
  recorrencia,
  alerta,
  case
    when alerta in ('queda_visitas_30d', 'queda_placas_30d', 'queda_alinhamento_balanceamento_30d') then 30
    when alerta in ('queda_visitas_60d', 'queda_placas_60d', 'queda_alinhamento_balanceamento_60d') then 60
    else null
  end as janela_dias,
  case
    when recorrencia in ('forte', 'medio') then 12
    else 24
  end as periodo_base_meses,
  visitas30,
  visitas60,
  case when recorrencia = 'forte' then visitas_mediana30 else visitas_mediana60 end as visitas_mediana,
  case when recorrencia = 'forte' then visitas_p25_30 else visitas_p25_60 end as visitas_p25,
  dias_sem_visita,
  intervalo_mediano_dias,
  placas30,
  placas60,
  case when recorrencia = 'forte' then placas_mediana30 else placas_mediana60 end as placas_mediana,
  case when recorrencia = 'forte' then placas_p25_30 else placas_p25_60 end as placas_p25,
  alinhamentos30,
  alinhamentos60,
  case when recorrencia = 'forte' then alinhamentos_mediana30 else alinhamentos_mediana60 end as alinhamentos_mediana,
  case when recorrencia = 'forte' then alinhamentos_p25_30 else alinhamentos_p25_60 end as alinhamentos_p25,
  ultima_visita,
  case
    when alerta = 'queda_visitas_30d' then concat(
      'Normalmente faz mediana de ', visitas_mediana30::text,
      ' visitas a cada 30 dias, mas fez ', visitas30::text,
      ' nos ultimos 30 dias. Dias desde a ultima visita: ', dias_sem_visita::text,
      '. Placas atendidas no periodo: ', placas30::text,
      '.'
    )
    when alerta = 'queda_visitas_60d' then concat(
      'Normalmente faz mediana de ', visitas_mediana60::text,
      ' visitas a cada 60 dias, mas fez ', visitas60::text,
      ' nos ultimos 60 dias. Dias desde a ultima visita: ', dias_sem_visita::text,
      '. Placas atendidas no periodo: ', placas60::text,
      '.'
    )
    when alerta = 'atraso_intervalo_normal' then concat(
      'Cliente esporadico costuma voltar a cada ', intervalo_mediano_dias::text,
      ' dias, mas esta ha ', dias_sem_visita::text,
      ' dias sem visita. Ultima visita em ', to_char(ultima_visita, 'DD/MM/YYYY'), '.'
    )
    when alerta = 'queda_placas_30d' then concat(
      'As visitas continuam proximas do normal, mas as placas atendidas cairam: ',
      placas30::text, ' placas nos ultimos 30 dias contra mediana historica de ',
      placas_mediana30::text, '.'
    )
    when alerta = 'queda_placas_60d' then concat(
      'As visitas continuam proximas do normal, mas as placas atendidas cairam: ',
      placas60::text, ' placas nos ultimos 60 dias contra mediana historica de ',
      placas_mediana60::text, '.'
    )
    when alerta = 'queda_alinhamento_balanceamento_30d' then concat(
      'Cliente manteve visitas, mas alinhamento/balanceamento caiu: ',
      alinhamentos30::text, ' nos ultimos 30 dias contra mediana de ',
      alinhamentos_mediana30::text, '.'
    )
    else concat(
      'Cliente manteve visitas, mas alinhamento/balanceamento caiu: ',
      alinhamentos60::text, ' nos ultimos 60 dias contra mediana de ',
      alinhamentos_mediana60::text, '.'
    )
  end as motivo,
  case
    when alerta like 'queda_alinhamento_balanceamento%' then 'Entender por que o mix de service caiu e oferecer alinhamento/balanceamento'
    when alerta like 'queda_placas%' then 'Confirmar se houve perda de placas, rota ou concorrente'
    else 'Contatar para entender queda de visitas de service'
  end as proxima_acao,
  case
    when alerta = 'queda_visitas_30d' then 132
    when alerta = 'queda_visitas_60d' then 126
    when alerta = 'atraso_intervalo_normal' then 112
    when alerta in ('queda_placas_30d', 'queda_placas_60d') then 110
    else 104
  end
  + least(12, greatest(0, visitas_12m / 2))::integer
  + case when dias_sem_visita >= 60 then 6 when dias_sem_visita >= 30 then 3 else 0 end
  as prioridade,
  status_comercial = 'nao_contatar' as bloqueada
from ranked
where rn = 1;

create or replace view public.oportunidades_clientes
with (security_invoker = true) as
with oportunidades as (
  select
    c.id as cliente_id,
    c.nome as cliente_nome,
    c.vendedor_id,
    'sem_vendedor' as tipo,
    'Cliente sem responsavel comercial.' as motivo,
    'Distribuir carteira' as proxima_acao,
    200 as prioridade,
    c.status_comercial = 'nao_contatar' as bloqueada
  from public.clientes c
  where c.excluido_em is null
    and c.vendedor_id is null

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'orcamento_vencido',
    'Proposta vencida sem ganho ou perda registrada.',
    'Retomar ou encerrar proposta',
    public.calcular_score_oportunidade(c) + 45,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and exists (
      select 1
      from public.orcamentos o
      where o.cliente_id = c.id
        and o.status in ('aberto', 'enviado', 'negociando')
        and o.validade < current_date
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'orcamento_aberto',
    'Proposta aberta precisa de retorno comercial.',
    'Retomar proposta aberta',
    public.calcular_score_oportunidade(c) + 35,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and exists (
      select 1
      from public.orcamentos o
      where o.cliente_id = c.id
        and o.status in ('aberto', 'enviado', 'negociando')
    )

  union all

  select
    svr.cliente_id,
    svr.cliente_nome,
    svr.vendedor_id,
    svr.tipo,
    svr.motivo,
    svr.proxima_acao,
    svr.prioridade,
    svr.bloqueada
  from public.vw_service_visitas_risco svr
)
select
  o.*,
  exists (
    select 1
    from public.tarefas t
    where t.cliente_id = o.cliente_id
      and t.status = 'aberta'
      and t.origem = 'oportunidade:' || o.tipo
  ) as tarefa_existente
from oportunidades o;

grant select on public.vw_service_visitas_risco to authenticated, service_role;

select public.refresh_oportunidades_cache();
