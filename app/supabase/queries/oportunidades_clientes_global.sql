create or replace view public.oportunidades_clientes
with (security_invoker = true) as
with oportunidades as (
  select
    c.id as cliente_id,
    c.nome as cliente_nome,
    c.vendedor_id,
    'sem_vendedor' as tipo,
    'Cliente sem responsavel comercial.' as motivo,
    'Distribuir carteira' as proxima_acao,
    90 as prioridade,
    c.status_comercial = 'nao_contatar' as bloqueada
  from public.clientes c
  where c.excluido_em is null
    and c.vendedor_id is null

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'rodobens_primeiro_contato',
    'Lead Rodobens sem primeiro contato registrado.',
    'Fazer primeiro contato e qualificar',
    88,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and c.origem_base = 'rodobens'
    and not exists (
      select 1 from public.interacoes i
      where i.cliente_id = c.id
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'cliente_risco_180',
    'Mais de 180 dias sem compra.',
    'Contato de reativacao',
    public.calcular_score_oportunidade(c) + 20,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and coalesce(current_date - c.ultima_compra_em, 9999) > 180

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'recompra_90',
    'Mais de 90 dias sem compra.',
    'Enviar WhatsApp de recompra',
    public.calcular_score_oportunidade(c) + 15,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and coalesce(current_date - c.ultima_compra_em, 9999) > 90
    and coalesce(current_date - c.ultima_compra_em, 9999) <= 180

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'alto_valor_sem_contato',
    'Cliente de alto valor sem contato recente.',
    'Ligar para relacionamento',
    public.calcular_score_oportunidade(c) + 18,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and coalesce(current_date - c.ultimo_contato_em::date, 9999) > 60
    and exists (
      select 1
      from public.vendas_itens v
      where v.cliente_id = c.id
      group by v.cliente_id
      having sum(v.valor_total) > 100000
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'orcamento_aberto',
    'Orcamento aberto precisa de retorno.',
    'Retomar orcamento',
    public.calcular_score_oportunidade(c) + 25,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and exists (
      select 1
      from public.orcamentos o
      where o.cliente_id = c.id
        and o.status in ('aberto', 'enviado', 'negociando')
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'orcamento_vencido',
    'Orcamento vencido sem ganho/perda.',
    'Retomar ou encerrar proposta',
    public.calcular_score_oportunidade(c) + 30,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and exists (
      select 1
      from public.orcamentos o
      where o.cliente_id = c.id
        and o.status in ('aberto', 'enviado', 'negociando')
        and o.validade < current_date
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'sem_whatsapp',
    'Cadastro sem WhatsApp valido.',
    'Atualizar cadastro',
    55,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and nullif(c.whatsapp_principal, '') is null
)
select
  o.*,
  exists (
    select 1
    from public.tarefas t
    where t.cliente_id = o.cliente_id
      and t.status = 'aberta'
      and t.origem = 'oportunidade:' || o.tipo
  ) as tarefa_existente
from oportunidades o;
