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
