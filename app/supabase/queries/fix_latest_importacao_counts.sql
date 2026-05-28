with counts as (
  select
    (select count(*)::integer from public.clientes) as clientes_total,
    (select count(*)::integer from public.vendas_itens) +
    (select count(*)::integer from public.servicos_itens) as itens_total,
    (select count(*)::integer from public.importacao_conflitos) as conflitos_total
)
update public.importacoes i
set
  clientes_criados = counts.clientes_total,
  clientes_encontrados = counts.clientes_total,
  itens_criados = counts.itens_total,
  conflitos = counts.conflitos_total,
  itens_ignorados = 0,
  total_linhas = counts.clientes_total + counts.itens_total,
  status = case when counts.conflitos_total > 0 then 'com_conflitos'::importacao_status else 'processada'::importacao_status end
from counts
where i.id = (
  select id
  from public.importacoes
  order by criado_em desc
  limit 1
)
returning
  i.id,
  i.total_linhas,
  i.clientes_encontrados,
  i.clientes_criados,
  i.itens_criados,
  i.conflitos,
  i.status;
