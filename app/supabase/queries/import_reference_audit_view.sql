create or replace view public.vw_importacoes_auditoria as
select
  i.id,
  i.tipo,
  i.arquivo_nome,
  i.data_importacao,
  i.status,
  i.total_linhas,
  i.clientes_encontrados,
  i.clientes_criados,
  i.itens_criados,
  i.itens_ignorados,
  i.conflitos,
  count(a.id) as arquivos,
  coalesce(sum(a.total_linhas), 0) as linhas_arquivos,
  jsonb_agg(
    jsonb_build_object(
      'tipo', a.tipo,
      'arquivo_nome', a.arquivo_nome,
      'arquivo_hash', a.arquivo_hash,
      'obrigatorio', a.obrigatorio,
      'total_linhas', a.total_linhas,
      'processado_em', a.processado_em
    )
    order by a.obrigatorio desc, a.tipo
  ) filter (where a.id is not null) as arquivos_detalhe
from public.importacoes i
left join public.importacao_arquivos a on a.importacao_id = i.id
group by i.id;
