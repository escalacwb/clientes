drop view if exists public.vw_forecast_vendedor;

create view public.vw_forecast_vendedor
with (security_invoker = true) as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  count(o.id) filter (where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao'))::integer as propostas_abertas,
  coalesce(sum(o.valor_total) filter (where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')), 0)::numeric(14, 2) as pipeline_aberto,
  coalesce(sum(
    case
      when o.status = 'aberto' then o.valor_total * 0.25
      when o.status = 'aguardando_aprovacao' then o.valor_total * 0.35
      when o.status = 'enviado' then o.valor_total * 0.45
      when o.status = 'negociando' then o.valor_total * 0.65
      else 0
    end
  ), 0)::numeric(14, 2) as forecast_ponderado,
  coalesce(sum(o.valor_total) filter (
    where o.status = 'ganho'
      and date_trunc('month', o.atualizado_em) = date_trunc('month', current_date)
  ), 0)::numeric(14, 2) as ganho_mes,
  count(o.id) filter (
    where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
      and o.validade < current_date
  )::integer as vencidas,
  count(o.id) filter (
    where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
      and o.validade between current_date and current_date + interval '7 days'
  )::integer as vencem_7d,
  max(o.atualizado_em) filter (where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')) as ultimo_movimento,
  case
    when count(o.id) filter (
      where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
        and o.validade < current_date
    ) > 0 then 'Retomar propostas vencidas'
    when count(o.id) filter (
      where o.status = 'aguardando_aprovacao'
    ) > 0 then 'Decidir aprovacoes pendentes'
    when count(o.id) filter (
      where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
        and o.atualizado_em < now() - interval '7 days'
    ) > 0 then 'Movimentar propostas paradas'
    else 'Manter cadencia de follow-up'
  end as gargalo_principal
from public.users u
left join public.orcamentos o on o.vendedor_id = u.id
where u.ativo = true
  and u.role in ('admin', 'vendedor')
group by u.id, u.nome
order by forecast_ponderado desc, pipeline_aberto desc;
