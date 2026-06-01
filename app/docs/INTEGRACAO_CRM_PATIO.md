# Integracao CRM + Controle de Patio

## Principio

O patio nao deve ganhar friccao comercial. Ele continua registrando entrada, servicos, boxes, finalizacao, motorista e responsavel do jeito mais rapido possivel.

O CRM passa a receber os sinais do patio e transforma isso em:

- contato recomendado;
- oportunidades de venda;
- tarefas de feedback;
- conflitos de cadastro;
- historico 360 do cliente e do veiculo.

## Fonte principal por tipo de dado

| Dado | Fonte preferencial | Uso |
| --- | --- | --- |
| Cadastro comercial, codigo ERP, carteira e vendedor | CRM/importacao ERP | Carteira, campanhas, propostas e funil |
| Contato de responsavel ou motorista recente | Patio | WhatsApp operacional e contato recomendado |
| Historico de venda de pneus/produtos | CRM/importacao ERP | Recompra, proposta e campanhas por produto |
| Servico faturado/importado | CRM/importacao ERP | Historico comercial e conferencia |
| Servico executado/box/KM/feedback | Patio | Feedback, revisao proativa e auditoria |
| Veiculo e placa real em atendimento | Patio + CRM por placa | Ficha 360 e conflitos |

## Tabelas novas no CRM

### `patio_clientes_snapshot`

Espelho dos clientes do patio, vinculado ao cliente mestre do CRM quando houver match por codigo ERP ou nome.

Nao substitui `clientes`.

### `patio_veiculos_snapshot`

Espelho dos veiculos do patio, vinculado ao veiculo mestre do CRM por placa.

Nao substitui `veiculos`.

### `patio_atendimentos`

Espelho de `execucao_servico`. Guarda finalizacao, KM, motorista, contato e feedback.

### `patio_atendimento_itens`

Une os itens de borracharia, alinhamento e manutencao em uma tabela unica para analise comercial.

### `cliente_contatos`

Foi expandida para aceitar:

- `tipo`: responsavel, motorista, operacional, cadastro;
- `origem_sistema`: crm, patio, importacao, manual;
- `prioridade`;
- `atualizado_em`;
- `valido`;
- `raw_data`.

O contato do patio entra como contato recomendado, mas nao sobrescreve automaticamente o cadastro principal.

## Views

### `vw_cliente_contatos_recomendados`

Escolhe o melhor contato para abordagem:

1. contatos validos vindos do patio;
2. maior prioridade;
3. mais recente;
4. fallback do cadastro CRM.

### `vw_patio_crm_oportunidades`

Gera sinais comerciais a partir do patio:

- feedback pendente;
- servico de pneu sem venda de pneu no periodo;
- venda de pneu sem montagem/balanceamento/alinhamento no patio;
- contato novo capturado no patio.

Esses sinais entram tambem em `oportunidades_clientes` e em `oportunidades_cache`.

## Fluxo correto

### Patio

O operador continua usando o app do patio normalmente:

1. busca placa;
2. cadastra cliente/veiculo se necessario;
3. lanca servicos;
4. aloca box;
5. finaliza atendimento;
6. registra motorista/responsavel quando tiver.

Nada disso chama telas de CRM.

### CRM

O vendedor usa o CRM para:

1. ver rotina e oportunidades;
2. abrir ficha 360;
3. usar contato recomendado;
4. criar proposta;
5. registrar contato/follow-up;
6. disparar campanhas.

Quando o patio gerar um sinal, o CRM mostra a oportunidade com motivo claro.

## Sincronizacao

Rodar no app do CRM:

```bash
npm run sb:sql -- supabase/queries/patio_crm_integracao.sql
npm run sync:patio:crm
```

O script:

- le o Supabase do patio em modo leitura;
- grava somente no Supabase do CRM;
- nao altera tabelas do patio;
- atualiza oportunidades ao final.

## Regras de oportunidades entre sistemas

### O que o patio gera para o CRM

- Cliente passou no patio hoje: lembrar vendedor se houver proposta aberta.
- Atendimento finalizado sem feedback: tarefa simples de pos-venda.
- Montagem/troca de pneu sem venda recente: entender origem do pneu e oferecer recompra.
- Venda de pneu sem servico no patio: oferecer montagem, balanceamento ou alinhamento.
- KM alto ou revisao proativa vencida: campanha de revisao.
- Contato novo de motorista/responsavel: validar contato antes de campanha.

### O que o CRM gera para o patio

- Cliente com proposta aberta: aviso simples no atendimento, sem bloquear operacao.
- Cliente em campanha/negociacao: contexto para nao tratar como atendimento frio.
- Historico de pneus comprados: ajuda operacional e comercial a entender medida/marca.

## Como unir os apps na pasta `clientes`

O caminho recomendado e manter uma aplicacao unica, com modos de trabalho:

- `Comercial`;
- `Patio`;
- `Gestao`.

O backend/tabelas ficam no CRM integrado. As telas do patio devem gravar nas tabelas operacionais do patio migradas ou em equivalentes finais:

- cadastro/entrada: `patio_clientes_snapshot`, `patio_veiculos_snapshot` e, depois da migracao completa, `clientes`/`veiculos` mestres;
- execucao: `patio_atendimentos`;
- itens: `patio_atendimento_itens`;
- contato capturado: `cliente_contatos` com `origem_sistema = 'patio'`.

O app de patio nao deve gravar diretamente em `interacoes`, `campanhas`, `orcamentos` ou `oportunidades`. Esses sao efeitos do CRM ou automacoes.
