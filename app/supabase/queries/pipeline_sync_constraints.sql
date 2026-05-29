create unique index if not exists oportunidades_orcamento_unique_idx
on public.oportunidades(orcamento_id)
where orcamento_id is not null;

create unique index if not exists oportunidades_campanha_cliente_unique_idx
on public.oportunidades(campanha_id, cliente_id)
where campanha_id is not null;
