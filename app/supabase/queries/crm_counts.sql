select 'users' as tabela, count(*)::bigint as total from public.users
union all select 'clientes', count(*)::bigint from public.clientes
union all select 'vendas_itens', count(*)::bigint from public.vendas_itens
union all select 'servicos_itens', count(*)::bigint from public.servicos_itens
union all select 'importacoes', count(*)::bigint from public.importacoes
union all select 'importacao_conflitos', count(*)::bigint from public.importacao_conflitos
union all select 'interacoes', count(*)::bigint from public.interacoes
union all select 'tarefas', count(*)::bigint from public.tarefas
order by tabela;
