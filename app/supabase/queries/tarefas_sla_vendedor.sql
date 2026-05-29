create or replace view public.vw_tarefas_sla_vendedor
with (security_invoker = true) as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  count(t.id)::integer as tarefas_abertas,
  count(t.id) filter (where t.data_vencimento::date < current_date)::integer as atrasadas,
  count(t.id) filter (where t.data_vencimento::date = current_date)::integer as vencem_hoje,
  count(t.id) filter (where t.prioridade >= 80)::integer as alta_prioridade,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'campanha%'
  )::integer as campanhas_atrasadas,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'orcamento%'
  )::integer as orcamentos_atrasados,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'rodobens%'
  )::integer as rodobens_atrasados,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'oportunidade%'
  )::integer as oportunidades_atrasadas,
  max(t.data_vencimento) filter (where t.status = 'aberta') as ultimo_vencimento
from public.users u
left join public.tarefas t
  on t.vendedor_id = u.id
  and t.status = 'aberta'
where u.ativo = true
group by u.id, u.nome;
