drop view if exists public.vw_funil_gerencial;

create view public.vw_funil_gerencial
with (security_invoker = true) as
with
  vendedor_keys as (
    select coalesce(c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id
    from public.clientes c
    where c.excluido_em is null
    union
    select coalesce(o.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.orcamentos o
    left join public.clientes c on c.id = o.cliente_id
    union
    select coalesce(i.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.interacoes i
    left join public.clientes c on c.id = i.cliente_id
    union
    select coalesce(t.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.tarefas t
    left join public.clientes c on c.id = t.cliente_id
  ),
  clientes as (
    select
      coalesce(c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) as clientes,
      count(*) filter (where c.origem_base = 'rodobens') as leads_rodobens
    from public.clientes c
    where c.excluido_em is null
    group by coalesce(c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ),
  contatos as (
    select
      coalesce(i.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) filter (where i.data_interacao >= current_date - interval '30 days') as contatos_30d
    from public.interacoes i
    left join public.clientes c on c.id = i.cliente_id
    group by coalesce(i.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ),
  orcamentos as (
    select
      coalesce(o.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) filter (where o.data_orcamento >= current_date - interval '30 days') as orcamentos_30d,
      count(*) filter (where o.status = 'ganho' and o.data_orcamento >= current_date - interval '30 days') as ganhos_30d,
      count(*) filter (where o.status = 'perdido' and o.data_orcamento >= current_date - interval '30 days') as perdidos_30d,
      coalesce(sum(o.valor_total) filter (where o.status in ('aberto', 'enviado', 'negociando')), 0)::numeric(14, 2) as pipeline_aberto,
      coalesce(avg((o.atualizado_em::date - o.data_orcamento)) filter (where o.status in ('ganho', 'perdido')), 0)::numeric(10, 2) as tempo_medio_fechamento
    from public.orcamentos o
    left join public.clientes c on c.id = o.cliente_id
    group by coalesce(o.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ),
  tarefas as (
    select
      coalesce(t.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) filter (where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas
    from public.tarefas t
    left join public.clientes c on c.id = t.cliente_id
    group by coalesce(t.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
select
  vk.vendedor_id,
  coalesce(u.nome, 'Sem vendedor') as vendedor_nome,
  coalesce(c.clientes, 0) as clientes,
  coalesce(c.leads_rodobens, 0) as leads_rodobens,
  coalesce(ct.contatos_30d, 0) as contatos_30d,
  coalesce(o.orcamentos_30d, 0) as orcamentos_30d,
  coalesce(o.ganhos_30d, 0) as ganhos_30d,
  coalesce(o.perdidos_30d, 0) as perdidos_30d,
  coalesce(o.pipeline_aberto, 0)::numeric(14, 2) as pipeline_aberto,
  coalesce(o.tempo_medio_fechamento, 0)::numeric(10, 2) as tempo_medio_fechamento,
  coalesce(t.tarefas_vencidas, 0) as tarefas_vencidas
from vendedor_keys vk
left join public.users u on u.id = vk.vendedor_id
left join clientes c on c.vendedor_id = vk.vendedor_id
left join contatos ct on ct.vendedor_id = vk.vendedor_id
left join orcamentos o on o.vendedor_id = vk.vendedor_id
left join tarefas t on t.vendedor_id = vk.vendedor_id
order by pipeline_aberto desc, clientes desc;

drop view if exists public.vw_motivos_perda;

create view public.vw_motivos_perda
with (security_invoker = true) as
select
  coalesce(nullif(o.motivo_perda, ''), 'nao_informado') as motivo,
  count(*) as total,
  coalesce(sum(o.valor_total), 0)::numeric(14, 2) as valor_total,
  max(o.atualizado_em) as ultimo_registro
from public.orcamentos o
where o.status = 'perdido'
group by coalesce(nullif(o.motivo_perda, ''), 'nao_informado')
order by total desc, valor_total desc;

drop view if exists public.vw_atividades_dia;

create view public.vw_atividades_dia
with (security_invoker = true) as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  count(distinct i.id) filter (where i.data_interacao::date = current_date) as contatos_hoje,
  count(distinct o.id) filter (where o.data_orcamento = current_date) as orcamentos_hoje,
  count(distinct t.id) filter (where t.status = 'concluida' and t.concluida_em::date = current_date) as tarefas_concluidas_hoje,
  count(distinct t.id) filter (where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas
from public.users u
left join public.interacoes i on i.vendedor_id = u.id
left join public.orcamentos o on o.vendedor_id = u.id
left join public.tarefas t on t.vendedor_id = u.id
where u.ativo = true
group by u.id, u.nome
order by contatos_hoje desc, orcamentos_hoje desc, tarefas_vencidas desc;
