alter table public.campanhas
  add column if not exists objetivo text,
  add column if not exists custo_estimado numeric(14, 2) not null default 0,
  add column if not exists meta_receita numeric(14, 2) not null default 0;

drop view if exists public.vw_campanhas_resumo;

create view public.vw_campanhas_resumo
with (security_invoker = true) as
select
  c.id as campanha_id,
  c.nome,
  c.criada_em,
  c.filtro_usado,
  c.objetivo,
  c.custo_estimado,
  c.meta_receita,
  count(ce.id)::integer as total,
  count(*) filter (where ce.status = 'pendente')::integer as pendentes,
  count(*) filter (where ce.status = 'enviado')::integer as enviados,
  count(*) filter (where ce.status = 'respondeu')::integer as responderam,
  count(*) filter (where ce.status = 'nao_respondeu')::integer as sem_resposta,
  count(*) filter (where ce.status = 'virou_orcamento' or ce.virou_orcamento)::integer as viraram_orcamento,
  count(*) filter (where ce.virou_venda)::integer as viraram_venda,
  count(*) filter (where ce.status = 'perdido')::integer as perdidos,
  count(*) filter (where ce.status = 'nao_contatar')::integer as nao_contatar,
  coalesce(sum(ce.receita_atribuida), 0)::numeric(14, 2) as receita_atribuida,
  case
    when c.custo_estimado > 0 then round(((coalesce(sum(ce.receita_atribuida), 0) - c.custo_estimado) / c.custo_estimado) * 100, 2)
    else 0
  end as roi_percent
from public.campanhas c
left join public.campanha_envios ce on ce.campanha_id = c.id
where c.filtro_usado ? 'segmentoId'
group by c.id, c.nome, c.criada_em, c.filtro_usado, c.objetivo, c.custo_estimado, c.meta_receita;
