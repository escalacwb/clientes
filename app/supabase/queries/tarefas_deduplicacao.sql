create unique index if not exists tarefas_abertas_cliente_origem_idx
on public.tarefas (cliente_id, origem)
where status = 'aberta' and origem is not null;
