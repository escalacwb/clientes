create table if not exists public.automacao_regras (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  evento text not null,
  acao text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.automacao_logs (
  id uuid primary key default gen_random_uuid(),
  regra_codigo text not null,
  entidade_tipo text not null,
  entidade_id uuid,
  resultado text not null,
  criado_em timestamptz not null default now()
);

create index if not exists automacao_logs_regra_idx on public.automacao_logs(regra_codigo, criado_em desc);
create index if not exists automacao_logs_entidade_idx on public.automacao_logs(entidade_tipo, entidade_id, criado_em desc);

drop trigger if exists automacao_regras_set_atualizado_em on public.automacao_regras;
create trigger automacao_regras_set_atualizado_em
before update on public.automacao_regras
for each row execute function public.set_atualizado_em();

alter table public.automacao_regras enable row level security;
alter table public.automacao_logs enable row level security;

drop policy if exists automacao_regras_read_admin on public.automacao_regras;
create policy automacao_regras_read_admin
on public.automacao_regras for select
using (public.current_user_is_admin());

drop policy if exists automacao_logs_read_admin on public.automacao_logs;
create policy automacao_logs_read_admin
on public.automacao_logs for select
using (public.current_user_is_admin());

drop policy if exists automacao_regras_admin_write on public.automacao_regras;
create policy automacao_regras_admin_write
on public.automacao_regras for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists automacao_logs_insert_authenticated on public.automacao_logs;
create policy automacao_logs_insert_authenticated
on public.automacao_logs for insert
with check (auth.role() = 'authenticated' or public.current_user_is_admin());

insert into public.automacao_regras (codigo, nome, descricao, evento, acao)
values
  ('pausar-sequencia-cliente', 'Pausar sequencia quando cliente reage', 'Pausa cadencias ativas quando ha resposta, orcamento, ganho, perda ou opt-out.', 'cliente_interagiu', 'pausar_sequencias'),
  ('orcamento-vencido-followup', 'Follow-up de orcamento vencido', 'Cria tarefa quando uma proposta vence sem fechamento.', 'orcamento_vencido', 'criar_tarefa')
on conflict (codigo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  evento = excluded.evento,
  acao = excluded.acao,
  ativo = true;
