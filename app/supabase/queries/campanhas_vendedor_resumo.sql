create or replace view public.vw_campanhas_vendedor_resumo
with (security_invoker = true) as
with envios as (
  select
    ce.*,
    c.custo_estimado,
    coalesce(u.nome, 'Sem vendedor') as vendedor_nome
  from public.campanha_envios ce
  left join public.campanhas c on c.id = ce.campanha_id
  left join public.users u on u.id = ce.vendedor_id
),
tarefas_campanha as (
  select
    vendedor_id,
    count(*) filter (where status = 'aberta')::integer as tarefas_abertas
  from public.tarefas
  where origem like 'campanha:%'
  group by vendedor_id
)
select
  e.vendedor_id,
  e.vendedor_nome,
  count(distinct e.campanha_id)::integer as campanhas,
  count(*)::integer as total,
  count(*) filter (where e.status = 'pendente')::integer as pendentes,
  count(*) filter (where e.status = 'enviado')::integer as enviados,
  count(*) filter (where e.status = 'respondeu')::integer as responderam,
  count(*) filter (where e.status = 'nao_respondeu')::integer as sem_resposta,
  count(*) filter (where e.status = 'virou_orcamento' or e.virou_orcamento)::integer as viraram_orcamento,
  count(*) filter (where e.virou_venda or e.status = 'ganhou')::integer as viraram_venda,
  count(*) filter (where e.status = 'perdido')::integer as perdidos,
  count(*) filter (where e.status = 'nao_contatar')::integer as nao_contatar,
  coalesce(max(tc.tarefas_abertas), 0)::integer as tarefas_abertas,
  coalesce(sum(e.receita_atribuida), 0)::numeric(14, 2) as receita_atribuida,
  coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 0)::numeric(14, 2) as custo_estimado,
  case
    when coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 0) > 0
      then round(((coalesce(sum(e.receita_atribuida), 0) - coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 0)) / coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 1)) * 100, 2)
    else 0
  end as roi_percent
from envios e
left join tarefas_campanha tc on tc.vendedor_id is not distinct from e.vendedor_id
group by e.vendedor_id, e.vendedor_nome;
