alter table public.orcamento_itens
  add column if not exists apresentacao text not null default 'normal';

