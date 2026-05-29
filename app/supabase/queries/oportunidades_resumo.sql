drop view if exists public.vw_oportunidades_resumo;

create view public.vw_oportunidades_resumo
with (security_invoker = true) as
select
  o.vendedor_id,
  o.tipo,
  count(*)::integer as total,
  count(*) filter (where not o.bloqueada and not coalesce(o.tarefa_existente, false))::integer as ativas,
  count(*) filter (where o.bloqueada or coalesce(o.tarefa_existente, false))::integer as bloqueadas,
  round(avg(o.prioridade), 1)::numeric(6, 1) as prioridade_media,
  max(o.prioridade)::integer as prioridade_maxima
from public.oportunidades_clientes o
group by o.vendedor_id, o.tipo;
