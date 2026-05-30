create table if not exists public.importacao_saneamento_resolucoes (
  issue_id text primary key,
  issue_type text not null,
  assigned_to text,
  resolved_at timestamptz,
  resolved_by text,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.importacao_saneamento_resolucoes enable row level security;

drop policy if exists "importacao_saneamento_select" on public.importacao_saneamento_resolucoes;
create policy "importacao_saneamento_select"
on public.importacao_saneamento_resolucoes
for select
to authenticated
using (true);

drop policy if exists "importacao_saneamento_insert" on public.importacao_saneamento_resolucoes;
create policy "importacao_saneamento_insert"
on public.importacao_saneamento_resolucoes
for insert
to authenticated
with check (true);

drop policy if exists "importacao_saneamento_update" on public.importacao_saneamento_resolucoes;
create policy "importacao_saneamento_update"
on public.importacao_saneamento_resolucoes
for update
to authenticated
using (true)
with check (true);

