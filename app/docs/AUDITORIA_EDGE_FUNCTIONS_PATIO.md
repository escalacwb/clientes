# Auditoria de funcoes externas do Patio

Data: 2026-06-01

## Resultado

O app original `controle-patio` nao possui pasta `supabase/functions` versionada. A listagem remota de Edge Functions do projeto do Patio tambem nao foi possivel com o token disponivel, retornando `403`.

Na pratica, as funcoes externas do Patio original estavam dentro do Streamlit/FastAPI:

- `utils.consultar_placa_comercial`: consulta WDAPI por placa.
- `utils.enviar_notificacao_telegram`: envia avisos para Telegram operacional/faturamento.
- `pages/analise_pneus.py`: usa OpenAI diretamente para laudo de pneus.
- Links de WhatsApp usam `wa.me`, nao API oficial.

## Paridade no CRM

- Importacao diaria e lista de precos: `import-reference-files`.
- Resumo de conversa WhatsApp com IA: `analyze-whatsapp-contact`.
- Analise de pneus com IA: `analyze-tire-inspection`, mantida para revisao posterior.
- Consulta de placa: replicada no CRM como `consult-vehicle-plate`.
- Telegram ao finalizar box: replicada no CRM como `send-patio-telegram`.
- WhatsApp: mantido com `wa.me` no CRM.

## Chamadas originais

- `pages/cadastro_servico.py` chama `consultar_placa_comercial` quando a placa nao existe na base.
- `pages/visao_boxes.py` chama `enviar_notificacao_telegram` depois de finalizar box, notificando operacional e, quando nao ha pendencias, faturamento.
- `pages/feedback_servicos.py` e `pages/revisao_proativa.py` montam links `wa.me`.

## Observacoes

O fluxo de criacao de veiculo/cliente novo do Patio antigo ainda depende de modelagem operacional mais ampla no CRM combinado. A consulta de placa ja foi isolada como Edge Function, mas o cadastro completo de placa nova deve ser tratado junto com a decisao de fonte mestre do Patio.
