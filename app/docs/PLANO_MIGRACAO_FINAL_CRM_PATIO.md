# Plano de migracao final CRM + Patio

## Estrategia recomendada

O banco combinado deve nascer a partir do Supabase de teste/CRM e virar a nova producao depois de validado. O Supabase antigo do Patio deve ser tratado como fonte de leitura durante a janela de corte.

Nao devemos tentar encaixar o schema novo dentro do schema antigo do Patio sem substituir o banco inteiro, porque os modelos mudaram:

- `clientes` e `veiculos` antigos usam IDs numericos.
- O CRM combinado usa UUIDs e preserva os IDs antigos em tabelas `patio_*_snapshot`.
- Servicos solicitados antigos, separados por area, viram itens normalizados em `patio_atendimento_itens`.

## Janela de corte

1. Encerrar uso do app antigo do Patio.
2. Confirmar com a equipe que nao havera lancamentos durante a migracao.
3. Fazer backup do Supabase antigo do Patio.
4. Fazer backup do Supabase CRM/teste.
5. Rodar migracao Patio producao -> CRM/teste.
6. Rodar validacoes automaticas.
7. Rodar teste manual rapido.
8. Promover banco testado como producao final.
9. Atualizar GitHub/envs do app final.
10. Liberar uso no dia seguinte.

## Tabelas antigas do Patio

- `clientes`
- `veiculos`
- `execucao_servico`
- `boxes`
- `funcionarios`
- `usuarios`
- `servicos_borracharia`
- `servicos_alinhamento`
- `servicos_manutencao`
- `servicos_solicitados_borracharia`
- `servicos_solicitados_alinhamento`
- `servicos_solicitados_manutencao`
- `alocacoes`

## Destino no banco combinado

| Origem antiga | Destino combinado | Observacao |
| --- | --- | --- |
| `clientes` | `patio_clientes_snapshot` + `clientes` | Preservar `patio_cliente_id` e enriquecer CRM. |
| `veiculos` | `patio_veiculos_snapshot` + `veiculos` | Preservar `patio_veiculo_id`, placa, motorista, contato e media. |
| `execucao_servico` | `patio_atendimentos` | Preservar `patio_execucao_id`, status, KM, datas, box, funcionario. |
| `servicos_solicitados_*` | `patio_atendimento_itens` | Normalizar area, servico, quantidade, status e observacao. |
| `boxes` | `patio_boxes_snapshot` | Preservar area e ocupacao. |
| `funcionarios` | `patio_funcionarios_snapshot` | Preservar tecnico/equipe. |
| `servicos_*` | `patio_catalogo_servicos_snapshot` | Base operacional do Patio. |
| `usuarios` | `users` | Mapear somente usuarios ativos/necessarios. |

## Validacoes obrigatorias

### Contagem

- Total de clientes antigos vs snapshots.
- Total de veiculos antigos vs snapshots.
- Total de execucoes antigas vs `patio_atendimentos`.
- Total de servicos solicitados por area vs `patio_atendimento_itens`.
- Total de boxes e funcionarios.
- Total de servicos concluidos nos ultimos 30 dias.

### Integridade

- Todo atendimento deve apontar para um veiculo snapshot.
- Todo item de atendimento deve apontar para um atendimento ou veiculo.
- Placas devem estar normalizadas sem perder original.
- Contatos de motorista/responsavel devem ser preservados.
- Boxes ocupados devem bater com atendimentos em aberto.

### Amostras manuais

Validar ao menos 20 placas reais:

- Historico por placa.
- Ultimo KM.
- Servicos feitos.
- Motorista e WhatsApp.
- Cliente vinculado.
- Ficha CRM.
- Feedback pendente, quando aplicavel.
- Revisao proativa, quando aplicavel.

### Fluxos do app

- Login admin.
- Login vendedor.
- Entrada de servico.
- Alocacao.
- Boxes.
- Finalizacao.
- Reversao de concluido.
- Historico placa.
- Feedback Patio.
- Revisao proativa.
- Ficha CRM.
- Proposta.
- Campanha.
- Mobile vendedor.

## Criterios para aprovar corte

- Nenhuma diferenca critica de contagem.
- Nenhuma tela operacional do Patio bloqueada.
- Feedback e revisao proativa carregando dados reais.
- Propostas e campanhas funcionando no banco final.
- Usuarios corretos com permissao correta.
- App publicado apontando para o Supabase promovido.

## Plano de rollback

Se a validacao falhar antes da liberacao:

1. Nao alterar o app antigo.
2. Manter equipe usando o Patio atual.
3. Guardar logs da migracao.
4. Corrigir ETL/schema.
5. Repetir a migracao em nova janela.

Se a falha ocorrer depois da liberacao:

1. Bloquear temporariamente novos lancamentos.
2. Avaliar se o erro e de frontend, funcao ou dado.
3. Corrigir no banco combinado quando possivel.
4. Se for bloqueio operacional grave, voltar app antigo apontado para Supabase antigo e repetir corte depois.

