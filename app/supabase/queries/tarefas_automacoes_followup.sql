create or replace function public.criar_tarefas_followup_automaticas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  orcamentos_vencidos integer := 0;
  campanhas_resposta integer := 0;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem executar automacoes de follow-up.';
  end if;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem
  )
  select
    o.cliente_id,
    o.vendedor_id,
    'Retomar orcamento vencido',
    concat(
      'Orcamento de ',
      to_char(o.valor_total, 'FM999G999G990D00'),
      ' venceu em ',
      to_char(o.validade, 'DD/MM/YYYY'),
      '. Revisar condicao, confirmar interesse e registrar proximo passo.'
    ),
    current_date::timestamptz,
    'aberta',
    case
      when o.valor_total >= 10000 then 95
      when o.valor_total >= 3000 then 88
      else 82
    end,
    concat('orcamento:vencido:', o.id::text)
  from public.orcamentos o
  where o.validade is not null
    and o.validade < current_date
    and o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
  on conflict (cliente_id, origem) where status = 'aberta' and origem is not null
  do update set
    vendedor_id = excluded.vendedor_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    data_vencimento = least(public.tarefas.data_vencimento, excluded.data_vencimento),
    prioridade = greatest(public.tarefas.prioridade, excluded.prioridade);

  get diagnostics orcamentos_vencidos = row_count;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem
  )
  select
    ce.cliente_id,
    coalesce(ce.vendedor_id, c.vendedor_id),
    case
      when ce.status = 'virou_orcamento' or ce.virou_orcamento then 'Acompanhar orcamento da campanha'
      else 'Responder cliente da campanha'
    end,
    concat(
      'Campanha: ',
      coalesce(ca.nome, 'sem nome'),
      case
        when nullif(ce.resposta_cliente, '') is not null then concat('. Resposta: ', left(ce.resposta_cliente, 220))
        else '. Cliente marcou resposta ou pediu retorno.'
      end
    ),
    current_date::timestamptz,
    'aberta',
    case
      when ce.status = 'virou_orcamento' or ce.virou_orcamento then 94
      else 90
    end,
    concat('campanha:resposta:', ce.id::text)
  from public.campanha_envios ce
  join public.campanhas ca on ca.id = ce.campanha_id
  join public.clientes c on c.id = ce.cliente_id
  where ce.status in ('respondeu', 'virou_orcamento')
    and not ce.virou_venda
  on conflict (cliente_id, origem) where status = 'aberta' and origem is not null
  do update set
    vendedor_id = excluded.vendedor_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    data_vencimento = least(public.tarefas.data_vencimento, excluded.data_vencimento),
    prioridade = greatest(public.tarefas.prioridade, excluded.prioridade);

  get diagnostics campanhas_resposta = row_count;

  return jsonb_build_object(
    'orcamentos_vencidos_tarefas', orcamentos_vencidos,
    'campanhas_resposta_tarefas', campanhas_resposta,
    'tarefas_followup_total', orcamentos_vencidos + campanhas_resposta
  );
end;
$$;
