alter table public.tarefas
add column if not exists reagendada_em timestamptz,
add column if not exists reagendamento_motivo text;
