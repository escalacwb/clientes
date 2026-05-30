alter table public.orcamentos
  add column if not exists pedido_confirmado_por uuid references public.users(id),
  add column if not exists pedido_confirmado_em timestamptz,
  add column if not exists pedido_referencia text,
  add column if not exists pedido_observacao text;
