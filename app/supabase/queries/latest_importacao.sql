select
  id,
  total_linhas,
  clientes_encontrados,
  clientes_criados,
  itens_criados,
  conflitos,
  status::text as status
from public.importacoes
order by criado_em desc
limit 1;
