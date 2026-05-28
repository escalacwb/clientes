select 'clientes' as tabela, count(*)::bigint as total from public.clientes
union all select 'veiculos', count(*)::bigint from public.veiculos
union all select 'ordens_movimento', count(*)::bigint from public.ordens_movimento
union all select 'vendas_itens', count(*)::bigint from public.vendas_itens
union all select 'servicos_itens', count(*)::bigint from public.servicos_itens
union all select 'catalogo_itens', count(*)::bigint from public.catalogo_itens
union all select 'catalogo_precos', count(*)::bigint from public.catalogo_precos
union all select 'importacao_arquivos', count(*)::bigint from public.importacao_arquivos;

select
  count(*) filter (where veiculo_id is not null)::bigint as ordens_com_veiculo,
  count(*) filter (where veiculo_id is null)::bigint as ordens_sem_veiculo
from public.ordens_movimento;
