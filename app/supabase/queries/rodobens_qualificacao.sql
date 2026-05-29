alter table public.clientes
  add column if not exists lead_qualificacao_status text not null default 'novo',
  add column if not exists lead_qualificacao_observacao text,
  add column if not exists lead_qualificado_em timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_lead_qualificacao_status_check'
  ) then
    alter table public.clientes
      add constraint clientes_lead_qualificacao_status_check
      check (lead_qualificacao_status in ('novo', 'contatado', 'qualificado', 'virou_cliente', 'descartado', 'nao_contatar'));
  end if;
end $$;

create index if not exists clientes_lead_qualificacao_idx
on public.clientes(lead_qualificacao_status)
where origem_base = 'rodobens';

drop view if exists public.vw_rodobens_funil;

create view public.vw_rodobens_funil
with (security_invoker = true) as
select
  c.lead_qualificacao_status as status,
  count(*)::integer as total,
  count(*) filter (where nullif(c.whatsapp_principal, '') is not null)::integer as com_whatsapp,
  count(*) filter (where c.vendedor_id is not null)::integer as com_vendedor
from public.clientes c
where c.excluido_em is null
  and c.origem_base = 'rodobens'
group by c.lead_qualificacao_status;

create or replace function public.auditar_cliente_alteracoes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid;
begin
  usuario_atual := public.current_app_user_id();

  if old.telefone_principal is distinct from new.telefone_principal then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'telefone_principal', old.telefone_principal, new.telefone_principal, 'app');
  end if;

  if old.whatsapp_principal is distinct from new.whatsapp_principal then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'whatsapp_principal', old.whatsapp_principal, new.whatsapp_principal, 'app');
  end if;

  if old.responsavel_nome is distinct from new.responsavel_nome then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'responsavel_nome', old.responsavel_nome, new.responsavel_nome, 'app');
  end if;

  if old.vendedor_id is distinct from new.vendedor_id then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'vendedor_id', old.vendedor_id::text, new.vendedor_id::text, 'app');
  end if;

  if old.status_comercial is distinct from new.status_comercial then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'status_comercial', old.status_comercial::text, new.status_comercial::text, 'app');
  end if;

  if old.lead_qualificacao_status is distinct from new.lead_qualificacao_status then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'lead_qualificacao_status', old.lead_qualificacao_status, new.lead_qualificacao_status, 'rodobens');
  end if;

  if old.origem_base is distinct from new.origem_base then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'origem_base', old.origem_base, new.origem_base, 'app');
  end if;

  return new;
end;
$$;
