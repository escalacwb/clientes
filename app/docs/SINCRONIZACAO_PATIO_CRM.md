# Sincronizacao Patio -> CRM

Objetivo: enquanto o Patio nao for usado em tempo real dentro do CRM, manter uma copia operacional dos dados do Supabase do Patio dentro do Supabase do CRM.

## O que e copiado

Origem: banco Supabase do Patio.

Destino: tabelas snapshot no banco Supabase do CRM.

O script sincroniza:

- clientes do Patio para `patio_clientes_snapshot`;
- veiculos do Patio para `patio_veiculos_snapshot`;
- atendimentos para `patio_atendimentos`;
- itens de borracharia, alinhamento e manutencao para `patio_atendimento_itens`;
- funcionarios para `patio_funcionarios_snapshot`;
- boxes para `patio_boxes_snapshot`;
- contatos de responsavel, telefone geral e motorista para `cliente_contatos`;
- oportunidades comerciais derivadas via `refresh_oportunidades_cache()`.

## Variaveis necessarias

No CRM (`app/.env.local`):

```env
SUPABASE_DB_URL=...
SUPABASE_DB_DIRECT_URL=...
```

No Patio (`M:\APPS\controle-patio\.env` ou `M:\APPS\controle-patio-backup-20260601-095959\.env`):

```env
DB_URL=...
```

Tambem pode ser usado:

```env
PATIO_DB_URL=...
PATIO_DATABASE_URL=...
```

## Producao: Edge Function

O modo recomendado daqui para frente e a Edge Function `sync-patio-crm`, agendada dentro do proprio Supabase. Assim a sincronizacao nao depende de um computador ligado, terminal aberto ou Agendador do Windows.

Status em 2026-07-03:

- Edge Function `sync-patio-crm` publicada no projeto Supabase do CRM;
- cron `sync-patio-crm-every-5-min` ativo no Supabase com agenda `*/5 * * * *`;
- ultima validacao automatica gravou `edge:incremental` com `status = ok`;
- tarefa local do Windows `CapitalTruck-PatioCrmSync` desativada para evitar execucao duplicada.

Fluxo:

1. gerar o arquivo local de secrets;
2. enviar os secrets para o Supabase;
3. fazer deploy da Edge Function;
4. criar o cron interno no banco do CRM.

```powershell
cd M:\APPS\clientes\app
npm.cmd run sync:patio:crm:edge-env
npm.cmd run supabase:secrets:sync-patio-crm
npm.cmd run supabase:deploy:sync-patio-crm
npm.cmd run sync:patio:crm:edge-cron
```

O arquivo gerado em `secrets/sync-patio-crm.edge.env` e ignorado pelo Git. Ele contem:

```env
CRM_DB_URL=...
PATIO_DB_URL=...
SYNC_PATIO_CRM_SECRET=...
PATIO_CRM_SYNC_MODE=incremental
PATIO_CRM_SYNC_LOOKBACK_MS=600000
```

Para testar a Edge Function manualmente depois do deploy:

```powershell
$secret = (Get-Content .\secrets\sync-patio-crm.edge.env | Where-Object { $_ -match '^SYNC_PATIO_CRM_SECRET=' }) -replace '^SYNC_PATIO_CRM_SECRET=', ''
Invoke-RestMethod `
  -Method Post `
  -Uri "$((Get-Content .env.local | Where-Object { $_ -match '^VITE_SUPABASE_URL=' }) -replace '^VITE_SUPABASE_URL=', '')/functions/v1/sync-patio-crm" `
  -Headers @{ 'x-sync-secret' = $secret } `
  -ContentType 'application/json' `
  -Body '{"mode":"incremental","refreshOportunidades":true}'
```

Depois de confirmar que o cron da Edge esta gravando execucoes `edge:incremental` em `crm_patio_sync_runs`, desative o fallback local:

```powershell
Disable-ScheduledTask -TaskName CapitalTruck-PatioCrmSync
```

## Rodar uma vez

```powershell
cd M:\APPS\clientes\app
npm.cmd run sync:patio:crm
```

Esse modo faz uma sincronizacao completa e encerra. Use quando precisar reconstruir o espelho inteiro.

## Rodar apenas atualizacoes

```powershell
cd M:\APPS\clientes\app
npm.cmd run sync:patio:crm:incremental
```

Esse e o modo recomendado para rotina. Ele usa `crm_patio_sync_state` para buscar:

- clientes e veiculos novos ou com `data_atualizacao_contato` recente;
- atendimentos novos, com `inicio_execucao`, `fim_execucao` ou `data_feedback` recente;
- atendimentos ainda nao finalizados;
- itens de servico novos ou com `data_atualizacao`/`data_solicitacao` recente;
- itens de servico ainda nao finalizados;
- funcionarios e boxes completos, porque sao tabelas pequenas.

O incremental usa uma margem de seguranca de 10 minutos antes do cursor para evitar perda por diferenca de relogio ou transacao atrasada.

## Manter atualizado em loop

```powershell
cd M:\APPS\clientes\app
npm.cmd run sync:patio:crm:watch
```

Padrao: sincroniza a cada 5 minutos.

Intervalo customizado:

```powershell
node scripts/sync-patio-to-crm.mjs --watch --interval-seconds 120
```

## Fallback: Agendador do Windows

Use apenas se a Edge Function ainda nao estiver publicada ou se o Supabase cron estiver indisponivel. Para rodar uma sincronizacao a cada 5 minutos em segundo plano:

```powershell
cd M:\APPS\clientes\app
.\scripts\register-patio-crm-sync-task.ps1 -IntervalMinutes 5
```

Esse modo executa `npm.cmd run sync:patio:crm:incremental` periodicamente. Ele evita sobreposicao: se uma execucao ainda estiver rodando, a proxima nao entra junto.

Verificar a tarefa:

```powershell
Get-ScheduledTask -TaskName CapitalTruck-PatioCrmSync
Get-ScheduledTaskInfo -TaskName CapitalTruck-PatioCrmSync
```

Remover a tarefa:

```powershell
Unregister-ScheduledTask -TaskName CapitalTruck-PatioCrmSync -Confirm:$false
```

## Monitoramento

Cada execucao grava uma linha em:

```sql
public.crm_patio_sync_runs
public.crm_patio_sync_state
```

Campos principais:

- `started_at`;
- `finished_at`;
- `status`: `running`, `ok` ou `erro`;
- `mode`: `full`, `incremental`, `edge:full`, `edge:incremental`, `once` ou `watch`;
- `summary`: totais sincronizados;
- `error_message`.

`crm_patio_sync_state` guarda o cursor por tabela de origem.

Consulta rapida:

```sql
select started_at, finished_at, status, mode, summary, error_message
from public.crm_patio_sync_runs
order by started_at desc
limit 20;
```

## Seguranca

- A conexao com o Patio e aberta como leitura.
- O destino CRM usa upsert idempotente.
- O script usa advisory lock no CRM para impedir duas sincronizacoes simultaneas.
- Nao imprimir strings de conexao em logs.

## Comando de ajuda

```powershell
node scripts/sync-patio-to-crm.mjs --help
```
