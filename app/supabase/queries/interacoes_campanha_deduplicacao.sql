create unique index if not exists interacoes_campanha_cliente_resultado_idx
on public.interacoes (cliente_id, campanha_id, resultado)
where canal = 'Campanha' and campanha_id is not null;
