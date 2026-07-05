create index if not exists idx_patio_atendimentos_feedback_pendente
on public.patio_atendimentos (status, data_feedback, fim_execucao, patio_execucao_id)
where status = 'finalizado' and data_feedback is null;

create index if not exists idx_cliente_contatos_recomendado
on public.cliente_contatos (cliente_id, valido, prioridade desc, atualizado_em desc);

create index if not exists idx_patio_atendimento_itens_feedback_visita
on public.patio_atendimento_itens (patio_execucao_id, status, area, servico_nome);

-- A definicao definitiva da fila de feedback por visita fica em:
-- app/supabase/queries/patio_feedback_visitas.sql
