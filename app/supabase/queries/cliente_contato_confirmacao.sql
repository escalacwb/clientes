alter table public.clientes
  add column if not exists contato_confirmado_em timestamptz;

