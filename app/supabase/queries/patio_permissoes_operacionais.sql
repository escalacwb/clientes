-- Permissoes operacionais do Patio usadas pelos RPCs de box/alocacao.
-- Hoje os usuarios ativos do app operacional podem estar como vendedor.

create or replace function public.patio_usuario_operacional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or public.current_user_is_admin()
    or exists (
      select 1
      from public.users u
      where u.auth_user_id = auth.uid()
        and u.ativo = true
        and u.role in ('operacao', 'admin', 'vendedor')
    )
$$;
