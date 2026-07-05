drop function if exists public.relatorio_patio_omsys(date, date, text);

create or replace function public.relatorio_patio_omsys(
  p_data_inicio date default current_date - 30,
  p_data_fim date default current_date,
  p_servico_nome text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with params as (
  select
    coalesce(p_data_inicio, current_date - 30) as data_inicio,
    coalesce(p_data_fim, current_date) as data_fim,
    coalesce(p_data_fim, current_date) + 1 as data_fim_exclusive,
    date_trunc('month', coalesce(p_data_fim, current_date))::date as mes_fim,
    (date_trunc('month', coalesce(p_data_fim, current_date)) - interval '11 months')::date as mes_inicio,
    nullif(btrim(p_servico_nome), '') as servico_filtro
),
servicos_periodo as (
  select
    si.id,
    si.cliente_id,
    c.nome as cliente_nome,
    si.codigo_cliente_erp,
    si.data_servico,
    coalesce(nullif(btrim(si.pedido), ''), si.id::text) as pedido_key,
    nullif(btrim(si.pedido), '') as pedido,
    nullif(btrim(si.nota), '') as nota,
    nullif(btrim(si.servico_codigo), '') as servico_codigo,
    coalesce(nullif(btrim(si.servico_nome), ''), 'Servico sem nome') as servico_nome,
    nullif(upper(regexp_replace(coalesce(si.placa, v.placa, ''), '[^A-Z0-9]+', '', 'g')), '') as placa_key,
    coalesce(si.valor_total, 0)::numeric as valor_total,
    coalesce(si.valor_unitario, 0)::numeric as valor_unitario
  from public.servicos_itens si
  left join public.clientes c on c.id = si.cliente_id
  left join public.veiculos v on v.id = si.veiculo_id
  cross join params
  where si.data_servico >= params.data_inicio
    and si.data_servico < params.data_fim_exclusive
),
servicos_12m_base as (
  select
    si.id,
    si.cliente_id,
    si.data_servico,
    coalesce(nullif(btrim(si.pedido), ''), si.id::text) as pedido_key,
    coalesce(nullif(btrim(si.servico_nome), ''), 'Servico sem nome') as servico_nome,
    nullif(upper(regexp_replace(coalesce(si.placa, v.placa, ''), '[^A-Z0-9]+', '', 'g')), '') as placa_key,
    coalesce(si.valor_total, 0)::numeric as valor_total
  from public.servicos_itens si
  left join public.veiculos v on v.id = si.veiculo_id
  cross join params
  where si.data_servico >= params.mes_inicio
    and si.data_servico < (params.mes_fim + interval '1 month')::date
),
servicos_12m_filtrados as (
  select b.*
  from servicos_12m_base b
  cross join params
  where params.servico_filtro is null
     or public.patio_omsys_norm(b.servico_nome) = public.patio_omsys_norm(params.servico_filtro)
),
meses as (
  select generate_series(params.mes_inicio, params.mes_fim, interval '1 month')::date as mes
  from params
),
mensal as (
  select
    meses.mes,
    coalesce(sum(s.valor_total), 0)::numeric(14, 2) as faturamento,
    count(s.id)::integer as servicos,
    count(distinct s.pedido_key)::integer as pedidos,
    count(distinct s.cliente_id) filter (where s.cliente_id is not null)::integer as clientes,
    count(distinct s.placa_key) filter (where s.placa_key is not null)::integer as placas,
    case
      when count(distinct s.pedido_key) > 0 then round((coalesce(sum(s.valor_total), 0) / count(distinct s.pedido_key))::numeric, 2)
      else 0::numeric
    end as ticket_medio
  from meses
  left join servicos_12m_filtrados s
    on date_trunc('month', s.data_servico)::date = meses.mes
  group by meses.mes
  order by meses.mes
),
resumo as (
  select
    coalesce(sum(valor_total), 0)::numeric(14, 2) as faturamento,
    count(*)::integer as servicos,
    count(distinct pedido_key)::integer as pedidos,
    count(distinct cliente_id) filter (where cliente_id is not null)::integer as clientes,
    count(distinct placa_key) filter (where placa_key is not null)::integer as placas,
    case
      when count(distinct pedido_key) > 0 then round((coalesce(sum(valor_total), 0) / count(distinct pedido_key))::numeric, 2)
      else 0::numeric
    end as ticket_medio
  from servicos_periodo
),
consolidados as (
  select pc.*
  from params
  cross join public.listar_pedidos_consolidados(params.data_inicio, params.data_fim_exclusive) pc
),
patio_periodo as (
  select
    pa.patio_execucao_id,
    pa.patio_veiculo_id,
    pa.cliente_id,
    c.codigo_erp,
    coalesce(pa.fim_execucao, pa.inicio_execucao) as data_execucao,
    pa.inicio_execucao,
    pa.fim_execucao,
    extract(epoch from (pa.fim_execucao - pa.inicio_execucao)) / 60 as duracao_minutos
  from public.patio_atendimentos pa
  left join public.clientes c on c.id = pa.cliente_id
  cross join params
  where pa.status = 'finalizado'
    and coalesce(pa.fim_execucao, pa.inicio_execucao)::date >= params.data_inicio
    and coalesce(pa.fim_execucao, pa.inicio_execucao)::date < params.data_fim_exclusive
),
qualidade as (
  select
    (select count(*)::integer from patio_periodo) as patio_visitas_finalizadas,
    (select count(distinct consolidado_id)::integer from consolidados where origem_consolidado = 'erp_com_patio' and tem_servico) as omsys_com_patio,
    (select count(distinct consolidado_id)::integer from consolidados where origem_consolidado = 'erp_sem_patio' and tem_servico) as omsys_sem_patio,
    (select count(distinct patio_execucao_id)::integer from consolidados where origem_consolidado = 'patio_sem_erp') as patio_sem_omsys,
    (select count(*)::integer from patio_periodo where codigo_erp = '55555') as consumidor_55555_aberto,
    (
      select count(*)::integer
      from public.patio_omsys_vendas_exportacoes e
      cross join params
      where e.data_visita >= params.data_inicio
        and e.data_visita < params.data_fim_exclusive
        and e.status in ('aguardando_carencia', 'pendente', 'bloqueada', 'preparada', 'erro')
    ) as vendas_patio_pendentes,
    (
      select count(*)::integer
      from public.patio_omsys_vendas_exportacoes e
      cross join params
      where e.data_visita >= params.data_inicio
        and e.data_visita < params.data_fim_exclusive
        and e.status = 'exportada'
    ) as vendas_patio_exportadas,
    (
      select count(*)::integer
      from public.crm_patio_conflitos c
      where c.tipo = 'vinculo_patio_erp_ambiguo'
        and c.status = 'aberto'
    ) as conflitos_abertos
),
operacional_resumo as (
  select
    count(*)::integer as visitas,
    round(avg(duracao_minutos) filter (where duracao_minutos > 0)::numeric, 1) as tempo_medio_minutos
  from patio_periodo
),
box_rank as (
  select
    coalesce(r.box_nome, case when r.box_id is not null then 'Box ' || r.box_id::text else 'Sem box' end) as label,
    count(distinct r.patio_execucao_id)::integer as visitas,
    count(*)::integer as itens,
    round(avg(r.duracao_minutos) filter (where r.duracao_minutos > 0)::numeric, 1) as tempo_medio_minutos
  from public.vw_patio_relatorio_servicos r
  cross join params
  where r.fim_execucao::date >= params.data_inicio
    and r.fim_execucao::date < params.data_fim_exclusive
  group by coalesce(r.box_nome, case when r.box_id is not null then 'Box ' || r.box_id::text else 'Sem box' end)
  order by visitas desc, itens desc
  limit 10
),
tecnico_rank as (
  select
    coalesce(r.funcionario_nome, 'Sem tecnico') as label,
    count(distinct r.patio_execucao_id)::integer as visitas,
    count(*)::integer as itens,
    round(avg(r.duracao_minutos) filter (where r.duracao_minutos > 0)::numeric, 1) as tempo_medio_minutos
  from public.vw_patio_relatorio_servicos r
  cross join params
  where r.fim_execucao::date >= params.data_inicio
    and r.fim_execucao::date < params.data_fim_exclusive
  group by coalesce(r.funcionario_nome, 'Sem tecnico')
  order by visitas desc, itens desc
  limit 10
),
area_rank as (
  select
    coalesce(r.area, 'Sem area') as label,
    count(distinct r.patio_execucao_id)::integer as visitas,
    count(*)::integer as itens,
    round(avg(r.duracao_minutos) filter (where r.duracao_minutos > 0)::numeric, 1) as tempo_medio_minutos
  from public.vw_patio_relatorio_servicos r
  cross join params
  where r.fim_execucao::date >= params.data_inicio
    and r.fim_execucao::date < params.data_fim_exclusive
  group by coalesce(r.area, 'Sem area')
  order by itens desc, visitas desc
),
servicos_por_volume as (
  select
    servico_nome as label,
    count(*)::integer as servicos,
    count(distinct pedido_key)::integer as pedidos,
    count(distinct cliente_id) filter (where cliente_id is not null)::integer as clientes,
    count(distinct placa_key) filter (where placa_key is not null)::integer as placas,
    coalesce(sum(valor_total), 0)::numeric(14, 2) as faturamento,
    round(avg(nullif(valor_total, 0))::numeric, 2) as ticket_item
  from servicos_periodo
  group by servico_nome
  order by servicos desc, faturamento desc
  limit 12
),
servicos_por_faturamento as (
  select
    servico_nome as label,
    count(*)::integer as servicos,
    count(distinct pedido_key)::integer as pedidos,
    count(distinct cliente_id) filter (where cliente_id is not null)::integer as clientes,
    count(distinct placa_key) filter (where placa_key is not null)::integer as placas,
    coalesce(sum(valor_total), 0)::numeric(14, 2) as faturamento,
    round(avg(nullif(valor_total, 0))::numeric, 2) as ticket_item
  from servicos_periodo
  group by servico_nome
  order by faturamento desc, servicos desc
  limit 12
),
clientes_por_faturamento as (
  select
    coalesce(cliente_nome, 'Cliente sem cadastro') as label,
    count(*)::integer as servicos,
    count(distinct pedido_key)::integer as pedidos,
    count(distinct placa_key) filter (where placa_key is not null)::integer as placas,
    coalesce(sum(valor_total), 0)::numeric(14, 2) as faturamento,
    round((coalesce(sum(valor_total), 0) / nullif(count(distinct pedido_key), 0))::numeric, 2) as ticket_medio
  from servicos_periodo
  group by coalesce(cliente_nome, 'Cliente sem cadastro')
  order by faturamento desc, pedidos desc
  limit 12
),
clientes_por_volume as (
  select
    coalesce(cliente_nome, 'Cliente sem cadastro') as label,
    count(*)::integer as servicos,
    count(distinct pedido_key)::integer as pedidos,
    count(distinct placa_key) filter (where placa_key is not null)::integer as placas,
    coalesce(sum(valor_total), 0)::numeric(14, 2) as faturamento,
    round((coalesce(sum(valor_total), 0) / nullif(count(distinct pedido_key), 0))::numeric, 2) as ticket_medio
  from servicos_periodo
  group by coalesce(cliente_nome, 'Cliente sem cadastro')
  order by pedidos desc, servicos desc
  limit 12
),
servico_opcoes as (
  select
    servico_nome as label,
    count(*)::integer as servicos
  from servicos_12m_base
  group by servico_nome
  order by count(*) desc, servico_nome
  limit 60
)
select jsonb_build_object(
  'periodo', jsonb_build_object(
    'inicio', params.data_inicio,
    'fim', params.data_fim,
    'fontePrincipal', 'OMSYS/importacao',
    'servicoGrafico', coalesce(params.servico_filtro, '')
  ),
  'resumo', (select to_jsonb(resumo) from resumo),
  'mensal', coalesce((select jsonb_agg(to_jsonb(mensal) order by mensal.mes) from mensal), '[]'::jsonb),
  'servicoOpcoes', coalesce((select jsonb_agg(to_jsonb(servico_opcoes)) from servico_opcoes), '[]'::jsonb),
  'servicosPorVolume', coalesce((select jsonb_agg(to_jsonb(servicos_por_volume)) from servicos_por_volume), '[]'::jsonb),
  'servicosPorFaturamento', coalesce((select jsonb_agg(to_jsonb(servicos_por_faturamento)) from servicos_por_faturamento), '[]'::jsonb),
  'clientesPorFaturamento', coalesce((select jsonb_agg(to_jsonb(clientes_por_faturamento)) from clientes_por_faturamento), '[]'::jsonb),
  'clientesPorVolume', coalesce((select jsonb_agg(to_jsonb(clientes_por_volume)) from clientes_por_volume), '[]'::jsonb),
  'qualidade', (select to_jsonb(qualidade) from qualidade),
  'operacional', jsonb_build_object(
    'resumo', (select to_jsonb(operacional_resumo) from operacional_resumo),
    'boxes', coalesce((select jsonb_agg(to_jsonb(box_rank)) from box_rank), '[]'::jsonb),
    'tecnicos', coalesce((select jsonb_agg(to_jsonb(tecnico_rank)) from tecnico_rank), '[]'::jsonb),
    'areas', coalesce((select jsonb_agg(to_jsonb(area_rank)) from area_rank), '[]'::jsonb)
  )
)
from params;
$$;

grant execute on function public.relatorio_patio_omsys(date, date, text) to authenticated, service_role;
