# Plano de Execucao do App Combinado

## Regra de seguranca

Enquanto a migracao nao estiver homologada:

- escrever somente no Supabase do CRM;
- usar Supabase do patio antigo apenas para leitura;
- nao substituir o app de patio em producao;
- nao mover dados mestres automaticamente sem conflito resolvido;
- sempre validar build antes de push.

## Fase 0: consolidacao do desenho

Status: em andamento.

Objetivo:

- fechar arquitetura;
- definir menus;
- definir contrato de tabelas;
- definir fluxo de migracao.

Entregas:

- `ARQUITETURA_APP_COMBINADO_CRM_PATIO.md`;
- `INTEGRACAO_CRM_PATIO.md`;
- `PLANO_EXECUCAO_APP_COMBINADO.md`.

Nao executar:

- telas novas;
- alteracoes grandes no schema;
- alteracao no Supabase do patio.

## Fase 1: shell do app combinado

Objetivo:

Criar a estrutura visual e funcional de modos sem migrar ainda todos os fluxos.

Entregas:

- seletor de modo `Patio | CRM | Gestao`;
- menus proprios por modo;
- persistencia do ultimo modo usado;
- regras mobile por modo;
- remover menus duplicados da experiencia principal.

Views por modo:

### Patio

- Entrada;
- Fila;
- Boxes;
- Concluidos;
- Historico placa.

### CRM

- Minha rotina;
- Clientes;
- Propostas;
- Campanhas;
- Oportunidades;
- Catalogo.
- Feedback pos-servico;
- Revisao proativa.

### Gestao

- Importacoes;
- Equipe;
- Conflitos;
- Auditoria;
- Configuracoes.

Criterio de pronto:

- usuario entende onde esta;
- troca modo sem perder sessao;
- mobile nao mostra menus desnecessarios;
- telas antigas ainda funcionam dentro do modo correto.

## Fase 2: contrato final de dados no Supabase do CRM

Objetivo:

Preparar o banco laboratorio para receber o app combinado sem depender do Supabase antigo do patio.

Entregas:

- revisar `patio_clientes_snapshot`;
- revisar `patio_veiculos_snapshot`;
- revisar `patio_atendimentos`;
- revisar `patio_atendimento_itens`;
- criar views de feedback pendente;
- criar views de revisao proativa;
- criar funcoes RPC para marcar feedback/revisao no CRM;
- criar conflitos de placa/cliente;
- revisar RLS por papel.

Nao fazer ainda:

- deletar tabelas antigas;
- migrar producao do patio;
- mudar app antigo.

Criterio de pronto:

- sync patio -> CRM roda completo;
- contagens batem;
- feedback e revisao podem operar no CRM;
- oportunidades geradas pelo patio aparecem no CRM.

## Fase 3: migrar Feedback para o app combinado

Objetivo:

Transformar Feedback em fluxo simples dentro do modo Patio, e sinal comercial dentro do CRM.

Tela CRM/Feedback:

- lista atendimentos finalizados sem feedback;
- filtros por data, vendedor, cidade, placa;
- contato recomendado;
- botao WhatsApp;
- marcar feedback feito;
- observacao curta;
- se houver interesse, criar tarefa ou oportunidade CRM.

Reflexo no CRM:

- item aparece em Minha rotina quando tiver responsavel;
- ficha 360 mostra feedback pendente/concluido;
- oportunidades nao devem duplicar tarefa aberta.

Criterio de pronto:

- marcar feedback atualiza CRM;
- nao depende de abrir app antigo;
- vendedor entende motivo do item na rotina.

## Fase 4: migrar Revisao Proativa

Objetivo:

Usar KM e historico do patio para gerar contatos uteis, sem virar tela tecnica demais.

Tela CRM/Revisao:

- lista veiculos por KM estimado;
- lista veiculos por dias sem visita;
- filtro por cidade, vendedor, cliente, placa;
- contato recomendado;
- botao WhatsApp;
- marcar contato realizado;
- criar oportunidade/proposta se houver interesse.

Parametros:

- KM minimo padrao;
- dias sem visita;
- ignorar veiculos ja contatados recentemente;
- prioridade por cliente com historico de compra.

Reflexo no CRM:

- oportunidade com tipo `revisao_proativa`;
- ficha 360 mostra ultimo contato de revisao;
- campanhas podem usar segmento de revisao.

Criterio de pronto:

- lista nao fica poluida;
- contato realizado some da fila;
- interesse vira oportunidade real.

## Fase 5: migrar Entrada/Fila/Boxes

Objetivo:

Trazer o fluxo operacional principal do patio para o app combinado, com UI moderna e sem aumentar cliques.

Entrada:

- busca por placa;
- resultado instantaneo;
- dados do cliente;
- motorista/responsavel;
- servicos;
- WhatsApp operacional;
- criar atendimento.

Fila:

- servicos pendentes por area;
- prioridade visual;
- alocar em box.

Boxes:

- cards de boxes;
- iniciar/finalizar;
- registrar KM;
- motorista;
- cancelar/reverter com permissao.

Criterio de pronto:

- operador consegue fazer o mesmo fluxo do app antigo;
- menos ou igual numero de passos;
- dados gravam no CRM integrado;
- sync com app antigo ainda possivel durante transicao.

## Fase 6: Ficha 360 final

Objetivo:

Unificar tudo que importa para cliente e veiculo.

Blocos:

- motivo de prioridade;
- contato recomendado;
- cadastro;
- veiculos;
- atendimentos do patio;
- servicos faturados;
- vendas de pneus;
- propostas;
- campanhas;
- tarefas;
- timeline.

Regras:

- mostrar primeiro o que ajuda o vendedor a agir;
- cadastro fica editavel, mas nao domina a tela;
- sinais do patio devem ser claros: placa, KM, data, motorista, servico.

Criterio de pronto:

- qualquer origem leva para uma ficha contextual;
- vendedor entende o que fazer em ate 10 segundos;
- dados de patio e CRM aparecem juntos sem confusao.

## Fase 7: Campanhas com sinais do patio

Objetivo:

Usar dados do patio para campanhas melhores.

Segmentos:

- revisao por KM;
- servico de pneu sem venda;
- venda de pneu sem alinhamento/montagem;
- cliente que passou no patio e nao compra ha X dias;
- contato novo capturado no patio;
- clientes externos convertidos.

Criterio de pronto:

- filtro mostra preview da lista;
- mensagem editavel;
- campanha salva;
- retorno claro.

## Fase 8: homologacao local

Objetivo:

Testar como usuario real antes de considerar migracao.

Testes:

- admin;
- vendedor;
- operador;
- desktop;
- mobile;
- entrada de veiculo;
- feedback;
- revisao;
- proposta;
- campanha;
- ficha 360;
- importacao;
- conflitos.

Criterio de pronto:

- sem erros no console;
- build passa;
- fluxos principais documentados;
- menus limpos;
- usuario pequeno consegue operar sem treinamento pesado.

## Fase 9: controle de resultado comercial

Objetivo:

Medir se as ferramentas comerciais baseadas no patio realmente geram retorno, sem atrapalhar a entrega da fusao.

Entregas:

- registrar cada revisao proativa enviada por placa, cliente, vendedor, contato e data;
- identificar automaticamente se a mesma placa retornou ao patio em ate 15 dias;
- classificar resultado como `retornou`, `orcamento`, `sem_retorno`, `nao_contatar` ou `sem_contato`;
- exibir resumo simples por vendedor e por periodo;
- mostrar na ficha 360 o historico de revisoes proativas e retornos;
- evitar novo disparo para a mesma placa dentro da janela configurada.

Criterio de pronto:

- usuario sabe quantos contatos foram feitos;
- usuario sabe quantas placas retornaram;
- resultado nao depende de planilha externa;
- a rotina operacional do patio continua igual.

## Fase 10: migracao final

Objetivo:

Somente depois da homologacao, planejar substituicao do app antigo.

Passos:

- congelar janela de migracao;
- backup do Supabase do patio;
- export final;
- importar no CRM integrado;
- testar contagens;
- apontar equipe para novo app;
- manter app antigo como fallback temporario;
- depois desativar.

## Ordem de implementacao recomendada

1. Shell de modos e menus.
2. Views/RPCs de feedback e revisao no CRM.
3. Telas Feedback e Revisao.
4. Ficha 360 com contexto operacional final.
5. Entrada/Fila/Boxes.
6. Campanhas usando sinais do patio.
7. Homologacao.
8. Controle de resultado comercial.
9. Migracao final.

## Riscos

### Risco: duplicar cadastro

Mitigacao:

- usar match por codigo ERP, nome normalizado e placa;
- gerar conflito quando houver divergencia.

### Risco: atrapalhar patio

Mitigacao:

- modo Patio separado;
- telas rapidas;
- nada de funil comercial no meio da entrada.

### Risco: vendedor abandonar CRM

Mitigacao:

- Minha rotina simples;
- motivo claro;
- poucos botoes;
- WhatsApp facil;
- proxima acao obrigatoria apenas quando fizer sentido.

### Risco: dados do patio antigo divergirem

Mitigacao:

- manter sync leitura;
- auditar contagens;
- migrar escrita apenas apos homologacao.

## Decisao atual

Nao executar novas migracoes grandes nem telas soltas antes de concluir a Fase 0.

Proxima execucao recomendada:

Fase 1, shell do app combinado.
