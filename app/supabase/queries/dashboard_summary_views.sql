create or replace view public.vw_dashboard_resumo as
select
  (select count(*) from public.clientes c where c.excluido_em is null) as clientes_total,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and c.ultima_compra_em is not null
      and c.ultima_compra_em >= current_date - interval '90 days'
  ) as clientes_ativos_90,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and (c.ultima_compra_em is null or c.ultima_compra_em < current_date - interval '90 days')
  ) as clientes_inativos_90,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and c.proxima_acao_em is not null
      and c.proxima_acao_em::date <= current_date
  ) as acoes_vencidas,
  (select count(*) from public.clientes c where c.excluido_em is null and c.vendedor_id is null) as clientes_sem_vendedor,
  (select count(*) from public.clientes c where c.excluido_em is null and nullif(c.whatsapp_principal, '') is null) as clientes_sem_whatsapp,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and (c.ultimo_contato_em is null or c.ultimo_contato_em < now() - interval '60 days')
  ) as clientes_sem_contato_60,
  (select count(*) from public.clientes c where c.excluido_em is null and c.origem_base = 'capital_truck') as clientes_capital,
  (select count(*) from public.clientes c where c.excluido_em is null and c.origem_base = 'rodobens') as clientes_rodobens,
  (select count(*) from public.clientes c where c.excluido_em is null and c.origem_base = 'desconhecida') as clientes_origem_desconhecida,
  (select coalesce(sum(c.total_comprado), 0) from public.clientes c where c.excluido_em is null) as total_comprado,
  (select coalesce(sum(c.total_servicos), 0) from public.clientes c where c.excluido_em is null) as total_servicos,
  (select count(*) from public.tarefas t where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas,
  (select count(*) from public.tarefas t where t.status = 'aberta') as tarefas_abertas,
  (
    select coalesce(sum(o.valor_total), 0)
    from public.orcamentos o
    where o.status in ('aberto', 'enviado', 'negociando')
  ) as pipeline_aberto,
  (select count(*) from public.orcamentos o where o.status in ('aberto', 'enviado', 'negociando')) as orcamentos_abertos,
  (select count(*) from public.orcamentos o where o.status = 'ganho') as orcamentos_ganhos,
  (select count(*) from public.orcamentos o) as orcamentos_total,
  (select count(*) from public.campanha_envios ce where ce.status = 'pendente') as campanhas_pendentes,
  (select count(*) from public.campanha_envios ce where ce.status = 'enviado') as campanhas_enviadas,
  (select count(*) from public.campanha_envios ce where ce.status = 'respondeu') as campanhas_responderam,
  (select count(*) from public.campanha_envios ce where ce.status = 'virou_orcamento') as campanhas_viraram_orcamento,
  (
    select count(*)
    from public.oportunidades_cache oc
    where not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_ativas,
  (select count(*) from public.oportunidades_cache oc) as oportunidades_total,
  (select max(oc.gerado_em) from public.oportunidades_cache oc) as oportunidades_atualizado_em,
  (
    select count(*)
    from public.oportunidades_cache oc
    where oc.tipo = 'sem_vendedor'
      and not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_sem_vendedor,
  (
    select count(*)
    from public.oportunidades_cache oc
    where oc.tipo = 'rodobens_primeiro_contato'
      and not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_rodobens,
  (
    select count(*)
    from public.oportunidades_cache oc
    where oc.tipo = 'orcamento_vencido'
      and not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_orcamento_vencido;

create or replace view public.vw_vendedores_resumo as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  u.role,
  (
    select count(*)
    from public.clientes c
    where c.vendedor_id = u.id
      and c.excluido_em is null
  ) as clientes,
  (
    select count(*)
    from public.clientes c
    where c.vendedor_id = u.id
      and c.excluido_em is null
      and (c.ultima_compra_em is null or c.ultima_compra_em < current_date - interval '180 days')
  ) as clientes_risco,
  (select count(*) from public.interacoes i where i.vendedor_id = u.id) as contatos,
  (select count(*) from public.tarefas t where t.vendedor_id = u.id and t.status = 'aberta') as tarefas_abertas,
  (
    select count(*)
    from public.tarefas t
    where t.vendedor_id = u.id
      and t.status = 'aberta'
      and t.data_vencimento::date < current_date
  ) as tarefas_vencidas,
  (
    select coalesce(sum(o.valor_total), 0)
    from public.orcamentos o
    where o.vendedor_id = u.id
      and o.status in ('aberto', 'enviado', 'negociando')
  ) as pipeline,
  (
    select coalesce(sum(c.total_comprado), 0)
    from public.clientes c
    where c.vendedor_id = u.id
      and c.excluido_em is null
  ) as total_carteira
from public.users u
where u.ativo = true;

create or replace view public.vw_ranking_medidas_vendidas as
select
  coalesce(nullif(medida, ''), produto_nome) as label,
  count(*) as itens,
  coalesce(sum(quantidade), 0) as quantidade,
  coalesce(sum(valor_total), 0) as valor_total
from public.vendas_itens
group by coalesce(nullif(medida, ''), produto_nome)
order by valor_total desc nulls last;

create or replace view public.vw_ranking_servicos_recorrentes as
select
  servico_nome as label,
  count(*) as itens,
  coalesce(sum(quantidade), 0) as quantidade,
  coalesce(sum(valor_total), 0) as valor_total
from public.servicos_itens
group by servico_nome
order by valor_total desc nulls last;
