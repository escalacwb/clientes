# Sincronizacao Patio -> CRM

Status em 2026-07-05: desativada.

O Supabase do CRM (`rdaahndxfmaxkfnyrhlc`) passou a ser a base definitiva do Patio. Por isso, nenhuma rotina de producao deve puxar dados do Supabase antigo do Patio.

O que foi bloqueado:

- a Edge Function `sync-patio-crm` retorna `410 sync_patio_crm_disabled`;
- os scripts locais `sync-patio-to-crm.mjs`, `schedule-sync-patio-crm-cron.mjs` e `write-sync-patio-crm-edge-env.ps1` encerram sem conectar ao Supabase antigo;
- o DPAPI do projeto foi regenerado sem variaveis do banco antigo;
- qualquer cron `sync-patio-crm` no banco deve permanecer removido.

Se algum dia for necessario recuperar dados historicos do Supabase antigo, crie uma rotina nova e isolada de migracao/auditoria. Nao reative este fluxo automatico, porque ele pode sobrescrever operacao atual do Patio no CRM.
