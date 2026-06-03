drop policy if exists campanhas_vendedor_manage_own on public.campanhas;

create policy campanhas_vendedor_manage_own
on public.campanhas for all
using (criada_por = public.current_app_user_id())
with check (criada_por = public.current_app_user_id());
