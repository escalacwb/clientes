alter table public.clientes
  add column if not exists data_atualizacao_contato timestamptz,
  add column if not exists data_ultima_exportacao timestamptz;

alter table public.patio_veiculos_snapshot
  add column if not exists data_ultima_exportacao timestamptz;

update public.clientes
set data_atualizacao_contato = coalesce(data_atualizacao_contato, atualizado_em, criado_em, now())
where data_atualizacao_contato is null;
