drop view if exists public.vw_funil_gerencial;

create view public.vw_funil_gerencial
with (security_invoker = true) as
select
  coalesce(u.id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
  coalesce(u.nome, 'Sem vendedor') as vendedor_nome,
  count(distinct c.id) filter (where c.excluido_em is null) as clientes,
  count(distinct c.id) filter (where c.excluido_em is null and c.origem_base = 'rodobens') as leads_rodobens,
  count(distinct i.id) filter (where i.data_interacao >= current_date - interval '30 days') as contatos_30d,
  count(distinct o.id) filter (where o.data_orcamento >= current_date - interval '30 days') as orcamentos_30d,
  count(distinct o.id) filter (where o.status = 'ganho' and o.data_orcamento >= current_date - interval '30 days') as ganhos_30d,
  count(distinct o.id) filter (where o.status = 'perdido' and o.data_orcamento >= current_date - interval '30 days') as perdidos_30d,
  coalesce(sum(o.valor_total) filter (where o.status in ('aberto', 'enviado', 'negociando')), 0)::numeric(14, 2) as pipeline_aberto,
  coalesce(avg((o.atualizado_em::date - o.data_orcamento)) filter (where o.status in ('ganho', 'perdido')), 0)::numeric(10, 2) as tempo_medio_fechamento,
  count(distinct t.id) filter (where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas
from public.clientes c
left join public.users u on u.id = c.vendedor_id
left join public.interacoes i on i.cliente_id = c.id
left join public.orcamentos o on o.cliente_id = c.id
left join public.tarefas t on t.cliente_id = c.id
where c.excluido_em is null
group by coalesce(u.id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(u.nome, 'Sem vendedor')
order by pipeline_aberto desc, clientes desc;
