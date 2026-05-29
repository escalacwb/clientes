create or replace view public.vw_clientes_campanha_elegibilidade
with (security_invoker = true) as
with ultimo_envio as (
  select
    cliente_id,
    max(coalesce(data_marcado_enviado, data_abertura_whatsapp)) as ultimo_envio_campanha
  from public.campanha_envios
  group by cliente_id
),
base as (
  select
    c.id as cliente_id,
    c.nome,
    c.vendedor_id,
    c.whatsapp_principal,
    c.status_comercial,
    c.lead_qualificacao_status,
    c.ultimo_contato_em,
    u.ultimo_envio_campanha,
    greatest(
      coalesce(c.ultimo_contato_em, '-infinity'::timestamptz),
      coalesce(u.ultimo_envio_campanha, '-infinity'::timestamptz)
    ) as ultimo_acionamento
  from public.clientes c
  left join ultimo_envio u on u.cliente_id = c.id
  where c.excluido_em is null
)
select
  cliente_id,
  nome,
  vendedor_id,
  whatsapp_principal,
  status_comercial,
  lead_qualificacao_status,
  ultimo_contato_em,
  ultimo_envio_campanha,
  nullif(ultimo_acionamento, '-infinity'::timestamptz) as ultimo_acionamento,
  case
    when status_comercial = 'nao_contatar' or lead_qualificacao_status = 'nao_contatar' then false
    when whatsapp_principal is null or trim(whatsapp_principal) = '' then false
    when ultimo_acionamento > now() - interval '7 days' then false
    else true
  end as elegivel,
  case
    when status_comercial = 'nao_contatar' or lead_qualificacao_status = 'nao_contatar' then 'Nao contatar'
    when whatsapp_principal is null or trim(whatsapp_principal) = '' then 'Sem WhatsApp'
    when ultimo_acionamento > now() - interval '7 days' then 'Contato recente'
    else 'Apto'
  end as motivo_bloqueio,
  case
    when ultimo_acionamento = '-infinity'::timestamptz then null
    else (ultimo_acionamento + interval '7 days')::date
  end as proximo_envio_em
from base;
