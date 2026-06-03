create table if not exists public.oportunidades_cache (
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  cliente_nome text not null,
  vendedor_id uuid references public.users(id) on delete set null,
  tipo text not null,
  motivo text not null,
  proxima_acao text not null,
  prioridade integer not null default 0,
  bloqueada boolean not null default false,
  tarefa_existente boolean not null default false,
  gerado_em timestamptz not null default now(),
  primary key (cliente_id, tipo)
);

create index if not exists oportunidades_cache_status_idx
on public.oportunidades_cache (bloqueada, tarefa_existente, prioridade desc);

create index if not exists oportunidades_cache_tipo_idx
on public.oportunidades_cache (tipo, prioridade desc);

create index if not exists oportunidades_cache_vendedor_idx
on public.oportunidades_cache (vendedor_id, prioridade desc);

create index if not exists oportunidades_cache_gerado_em_idx
on public.oportunidades_cache (gerado_em desc);

alter table public.oportunidades_cache enable row level security;

drop policy if exists oportunidades_cache_read_own_or_admin on public.oportunidades_cache;
create policy oportunidades_cache_read_own_or_admin
on public.oportunidades_cache for select
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
);

drop policy if exists admin_manage_oportunidades_cache on public.oportunidades_cache;
create policy admin_manage_oportunidades_cache
on public.oportunidades_cache for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create or replace function public.refresh_oportunidades_cache()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem atualizar oportunidades.';
  end if;

  delete from public.oportunidades_cache where true;

  insert into public.oportunidades_cache (
    cliente_id,
    cliente_nome,
    vendedor_id,
    tipo,
    motivo,
    proxima_acao,
    prioridade,
    bloqueada,
    tarefa_existente,
    gerado_em
  )
  select
    cliente_id,
    cliente_nome,
    vendedor_id,
    tipo,
    motivo,
    proxima_acao,
    prioridade,
    coalesce(bloqueada, false),
    coalesce(tarefa_existente, false),
    now()
  from public.oportunidades_clientes;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.marcar_oportunidade_com_tarefa(p_cliente_id uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not (
    public.current_user_is_admin()
    or exists (
      select 1
      from public.clientes c
      where c.id = p_cliente_id
        and c.vendedor_id = public.current_app_user_id()
    )
  ) then
    raise exception 'Sem permissao para atualizar esta oportunidade.';
  end if;

  update public.oportunidades_cache
  set tarefa_existente = true,
      gerado_em = now()
  where cliente_id = p_cliente_id
    and tipo = p_tipo;
end;
$$;

drop view if exists public.vw_oportunidades_resumo_cache;

create view public.vw_oportunidades_resumo_cache
with (security_invoker = true) as
select
  o.vendedor_id,
  o.tipo,
  count(*)::integer as total,
  count(*) filter (where not o.bloqueada and not o.tarefa_existente)::integer as ativas,
  count(*) filter (where o.bloqueada or o.tarefa_existente)::integer as bloqueadas,
  round(avg(o.prioridade), 1)::numeric(6, 1) as prioridade_media,
  max(o.prioridade)::integer as prioridade_maxima,
  max(o.gerado_em) as gerado_em
from public.oportunidades_cache o
group by o.vendedor_id, o.tipo;

select public.refresh_oportunidades_cache();
