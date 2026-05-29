# Roadmap profissional - Capital Truck CRM

Atualizado em: 2026-05-28

Queue operacional atual: `QUEUE_EVOLUCAO_MACRO_CRM.md`.

## Objetivo

Transformar o app em uma ferramenta comercial completa para carteira, pos-venda, orcamentos, campanhas e importacao diaria. O sistema deve ser mais pratico que um CRM generico porque nasce dos dados reais da Capital Truck: clientes, placas, KM, vendas de produtos, servicos, vendedores historicos e tabelas de preco.

## Benchmark de concorrentes

### Pipedrive

Referencias:
- https://www.pipedrive.com/en/products/sales/leads
- https://www.pipedrive.com/en/features/activities-goals
- https://www.pipedrive.com/en/products

O que vale adaptar:
- Inbox de leads para separar prospects ainda nao qualificados dos clientes ativos.
- Labels e filtros rapidos por origem, prioridade, cidade, vendedor, produto e status.
- Atividades sempre ligadas ao cliente/deal, com visao de vencidas, hoje e proximas.
- Deal rotting: alerta quando uma oportunidade fica parada.
- Catalogo de produtos/servicos ligado a oportunidades e orcamentos.
- Relatorios orientados a atividade: contatos feitos, tarefas vencidas, oportunidades paradas, conversao.

Aplicacao para a Capital:
- Criar "Inbox Rodobens" para primeiro contato, sem misturar com carteira ativa Capital.
- Criar "oportunidades paradas" para orcamentos sem movimento ha X dias.
- Medir vendedor por acoes controlaveis: contatos, propostas, follow-ups, reativacoes.

### HubSpot

Referencias:
- https://knowledge.hubspot.com/quotes/create-and-send-quotes
- https://developers.hubspot.com/docs/reference/api/crm/lists

O que vale adaptar:
- Orcamentos com line items vindos da biblioteca de produtos.
- Edicao de itens com quantidade, preco, desconto, impostos/condicoes e ordenacao.
- Templates de proposta com capa, resumo, validade, termos e anexos.
- Associacao de proposta ao negocio/cliente e atualizacao do pipeline.
- Segmentos/listas para campanhas e automacoes.

Aplicacao para a Capital:
- Orcamento precisa virar uma tela propria, com editor de itens e preview de mensagem/proposta.
- Segmentos devem ser salvos: Rodobens sem contato, inativos 90 dias, comprou pneu X, fez alinhamento, sem WhatsApp, orcamento vencido.
- Cada campanha deve nascer de um segmento salvo e registrar resultado.

### Salesforce CPQ

Referencia:
- https://www.salesforce.com/sales/cpq/

O que vale adaptar:
- CPQ: configurar, precificar e gerar proposta.
- Regras de desconto, inclusive por volume.
- Aprovacao quando desconto passa de limite.
- Protecao de margem antes de enviar proposta.
- Geracao profissional de documento de proposta.

Aplicacao para a Capital:
- Definir desconto maximo por produto/servico vindo da lista de preco.
- Se o vendedor passar do limite, marcar proposta como "aguardando aprovacao".
- Criar regras simples: quantidade maior pode sugerir desconto; item sem preco nao pode ser enviado.

### Zoho CRM / Zoho CPQ

Referencias:
- https://help.zoho.com/portal/en/kb/crm/getting-started/introduction-to-zoho-crm/articles/understand-crm-account
- https://help.zoho.com/portal/en/kb/crm/sales-force-automation/activities/articles/activities
- https://help.zoho.com/portal/en/kb/crm/marketing-automation-tools/campaigns/articles/create-campaigns
- https://www.zoho.com/crm/cpq.html

O que vale adaptar:
- Modulos separados e claros: leads, clientes, deals/oportunidades, quotes, tasks, campaigns.
- Atividades divididas entre tarefas, ligacoes e reunioes, sempre visiveis na ficha do cliente.
- Campanhas com planejamento: custo, receita esperada, periodo, publico e ROI.
- CPQ com regras de produto, sugestoes complementares e calculo dinamico de preco/desconto.

Aplicacao para a Capital:
- Separar "cliente" de "oportunidade" e "campanha".
- Cada ficha do cliente deve mostrar atividades abertas e fechadas.
- Campanha deve ter objetivo comercial, publico, responsavel, custo e resultado.
- Orcamento deve sugerir itens complementares: balanceamento/alinhamento junto com pneu, por exemplo.

## Diagnostico do app atual

### Ja utilizavel

- Login com usuarios reais.
- Base Supabase com clientes, veiculos, vendas, servicos, catalogo e precos importados.
- Clientes paginados na UI em blocos de 50.
- Ficha 360 como pagina, com filtros por periodo, vendedor historico, tipo e veiculo.
- Importacao de arquivos referencia com preview e importacao server-side/local para cargas grandes.
- Tarefas basicas com criacao, conclusao, filtros e carga por vendedor.
- Orcamento basico com catalogo importado, desconto por item e mensagem WA.ME.

### Ainda simplificado

- Clientes ainda carregam uma base muito grande no primeiro load.
- Orcamentos ainda nao possuem tela propria de proposta/CPQ.
- Campanhas ainda sao uma reativacao fixa, nao um modulo de segmentacao.
- Tarefas ja tem automacao inicial de follow-up, mas ainda nao tem calendario/kanban nem motor configuravel de regras.
- Relatorios ainda misturam muito indicador agregado e pouco funil acionavel.
- Relatorios ganharam forecast ponderado inicial por vendedor, mas ainda faltam metas configuraveis.
- Nao ha Inbox Rodobens/leads separado.
- Nao ha aprovacao de desconto, margem, estoque, validade de tabela ou versao da proposta.

## Roteiro de implementacao

### Fase 1 - Performance e base operacional

Prioridade: maxima.

1. Trocar carregamento inicial por queries paginadas no Supabase.
   - Clientes: buscar 50 por pagina com total estimado.
   - Historico: buscar apenas do cliente aberto.
   - Orcamentos, tarefas e campanhas: pagina ou filtros por data/status.
   - Criar endpoints/repositories com `range`, `limit`, `offset` e filtros.

2. Criar views agregadas para dashboard.
   - `vw_dashboard_comercial`
   - `vw_clientes_resumo`
   - `vw_vendedores_resumo`
   - `vw_campanhas_resumo`
   - Evitar carregar todas as vendas/servicos no browser.

3. Padronizar estados de carregamento.
   - Nunca mostrar fallback falso enquanto Supabase carrega.
   - Mostrar skeleton/spinner e mensagens objetivas.
   - Separar "carregando lista" de "carregando historico".

### Fase 2 - Inbox Rodobens e qualificacao

Prioridade: maxima.

1. Criar tela "Leads Rodobens".
   - Somente clientes `origem_base = rodobens`.
   - Status: novo, contato feito, qualificado, virou cliente, descartado, nao contatar.
   - Campos: cidade, WhatsApp, vendedor historico, ultima compra/servico se existir.

2. Criar fluxo de qualificacao.
   - Botao para abrir WhatsApp.
   - Registrar resultado do contato.
   - Criar tarefa de retorno.
   - Converter lead em carteira Capital.

3. Criar metricas.
   - Rodobens total.
   - Sem primeiro contato.
   - Contatados.
   - Responderam.
   - Viraram orcamento.
   - Viraram venda.

### Fase 3 - Orcamento profissional / CPQ Capital

Prioridade: maxima.

1. Criar pagina propria de orcamento.
   - Rota/tela: `orcamento/:id` ou modal full-page.
   - Cabecalho com cliente, vendedor, validade, condicao, status.
   - Editor tabular de itens.
   - Preview WhatsApp e preview proposta.
   - Primeira tela propria entregue em `Proposta comercial`, aberta pela lista de orcamentos.

2. Melhorar busca de catalogo.
   - Buscar por codigo, nome, medida, marca, grupo e tipo.
   - Separar produtos e servicos.
   - Mostrar preco vigente, desconto maximo, unidade e estoque quando existir.

3. Condicoes comerciais.
   - Multiplas condicoes: a vista, 30 dias, 30/60/90, cartao.
   - Prazo de entrega/execucao.
   - Observacoes e termos padrao.
   - Versoes da proposta.
   - Condicoes comerciais passaram a ser gravadas em `orcamento_condicoes`, preservando os valores por proposta.

4. Regras de preco e desconto.
   - Desconto por item.
   - Desconto maximo vindo de tabela.
   - Bloqueio/alerta se passar limite.
   - Aprovacao do gerente.
   - Motivo obrigatorio para desconto acima do normal.

5. Saida profissional.
   - Mensagem curta WA.ME.
   - Proposta formatada em HTML/PDF.
   - Modelo com logo, dados do cliente, itens, totais, validade e termos.
   - Copiar texto ou abrir WhatsApp.

6. Automacoes do funil.
   - Enviado cria tarefa de follow-up.
   - Vencido vira tarefa urgente. Primeira automacao entregue para orcamentos vencidos.
   - Perdido exige motivo.
   - Ganho marca oportunidade e pode gerar registro para venda futura.

### Fase 4 - Campanhas profissionais

Prioridade: alta.

1. Criar segmentos salvos.
   - Rodobens sem contato.
   - Inativos 90/180/365 dias.
   - Clientes sem WhatsApp.
   - Compraram determinada medida/produto.
   - Fizeram servico especifico.
   - Orcamento enviado sem resposta.
   - Cidade/UF/vendedor/origem.
   - Primeira evolucao entregue: filtros combinaveis por cidade, UF, vendedor, origem, produto/servico, recencia de compra/contato, valor historico minimo e WhatsApp.
   - Segunda evolucao entregue: cruzamento por vendedor historico, status de lead, medida, placa/veiculo e faixa de KM.

2. Criar campanhas como entidade real.
   - Nome, objetivo, responsavel, periodo, publico, template, status.
   - Estimativa de alcance.
   - Custo opcional.
   - Receita esperada opcional.

3. Criar fila de envio.
   - Um contato por vez via WA.ME no inicio.
   - Status por cliente: pendente, aberto, enviado, respondeu, virou orcamento, ganhou, perdido, nao contatar.
   - Evitar duplicidade dentro da mesma campanha.
   - Janela minima entre campanhas.
   - Primeira trava visual entregue: sem WhatsApp, nao contatar e contato recente ficam bloqueados antes do WA.ME.
   - Elegibilidade no banco entregue em `vw_clientes_campanha_elegibilidade`, com motivo do bloqueio e proximo envio permitido.
   - Janela minima configuravel por campanha e opt-out com motivo/data/usuario entregues.

4. Relatorio de campanha.
   - Alcance.
   - Enviados.
   - Respostas.
   - Orcamentos.
   - Vendas.
   - Receita atribuida.
   - ROI se tiver custo.

### Fase 5 - Tarefas, atividades e rotina do vendedor

Prioridade: alta.

1. Separar tipos de atividade.
   - Tarefa.
   - Ligacao.
   - WhatsApp.
   - Visita.
   - Reuniao.
   - Follow-up de orcamento.

2. Melhorar rotina diaria.
   - Hoje.
   - Atrasadas.
   - Alta prioridade.
   - Orcamentos vencendo.
   - Rodobens pendentes.
   - Clientes em risco.

3. Criar automacoes.
   - Proximo contato apos interacao.
   - Follow-up automatico apos orcamento enviado.
   - Tarefa quando cliente responde campanha.
   - Alerta se oportunidade parada.

4. Criar visao gerente.
   - Tarefas por vendedor.
   - Atrasos.
   - Atividades feitas no dia.
   - Conversao de atividade em proposta/venda.

### Fase 6 - Ficha 360 avancada

Prioridade: media-alta.

1. Melhorar abas.
   - Resumo.
   - Dados cadastrais.
   - Veiculos.
   - Vendas.
   - Servicos.
   - Orcamentos.
   - Campanhas.
   - Tarefas/atividades.
   - Auditoria.

2. Acoes contextuais.
   - Criar orcamento a partir de venda anterior.
   - Repetir cesta de produtos.
   - Criar campanha/contato a partir de inatividade.
   - Criar tarefa para vendedor responsavel.

3. Inteligencia por historico.
   - Produto mais comprado.
   - Medida mais comprada.
   - Frequencia media de compra.
   - Servicos recorrentes.
   - Veiculos com maior recorrencia.
   - Proxima recompra provavel.

### Fase 7 - Produtos, servicos e tabelas de preco

Prioridade: media.

1. Catalogo administrativo.
   - Lista de produtos.
   - Lista de servicos.
   - Tabelas de preco.
   - Vigencia.
   - Historico de alteracao.

2. Importacao incremental.
   - Atualizar preco quando mudar.
   - Nao duplicar item igual.
   - Guardar preco anterior com vigencia.
   - Mostrar resumo de alteracoes.

3. Regras comerciais.
   - Produtos complementares.
   - Servicos sugeridos.
   - Desconto maximo.
   - Produtos/servicos inativos.

### Fase 8 - Relatorios gerenciais

Prioridade: media.

1. Vendedor.
   - Carteira atual.
   - Vendas historicas.
   - Contatos feitos.
   - Orcamentos enviados.
   - Conversao.
   - Follow-ups atrasados.

2. Origem.
   - Capital vs Rodobens.
   - Receita por origem.
   - Conversao Rodobens.
   - Clientes sem primeiro contato.

3. Produto/servico.
   - Ranking de medidas.
   - Ranking de servicos.
   - Produtos recorrentes.
   - Recompra provavel.

4. Funil.
   - Leads.
   - Contatos.
   - Orcamentos.
   - Ganhos.
   - Perdidos.
   - Motivos de perda.

## Implementacoes recomendadas para a proxima sprint

1. Criar pagina propria de orcamento com editor de itens.
2. Criar repositorios paginados para clientes e dashboard.
3. Criar tela Inbox Rodobens.
4. Criar segmentos salvos para campanhas.
5. Criar automacao de follow-up de orcamento.
6. Criar relatorio por vendedor com atividades e propostas.

## Execucao da queue

### 2026-05-28 - Clientes paginados

Status: concluido.

Entregue:
- `listClientesPage` passou a aplicar `range` e `count` no Supabase.
- Tela Clientes passou a carregar 50 registros por pagina.
- Busca global na tela Clientes agora consulta o Supabase e volta para a pagina 1.
- Filtros principais de clientes foram traduzidos para query no banco: origem, acao hoje, sem compra, sem contato, sem WhatsApp, sem vendedor, orcamento aberto e alto potencial.
- Banner da tela usa total vindo do banco, nao o tamanho da pagina carregada.

Validacao local:
- Login como Wagner Fonseca.
- Clientes carregou pagina 1 com 50 registros.
- Botao Proxima carregou pagina 2.
- Busca por `SANTA` retornou 137 clientes em 3 paginas.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar agregados/views para Dashboard, Carteira, Campanhas e Relatorios, porque essas telas ainda usam a pagina atual de clientes quando o app esta em modo paginado.

### 2026-05-28 - Views agregadas para dashboard e relatorios

Status: concluido.

Entregue:
- Criadas views `vw_dashboard_resumo`, `vw_vendedores_resumo`, `vw_ranking_medidas_vendidas` e `vw_ranking_servicos_recorrentes`.
- Criado `dashboardRepository` para ler os agregados do Supabase.
- Dashboard passou a usar indicadores globais do banco quando Supabase esta configurado.
- Relatorios passaram a usar resumo global, produtividade por vendedor e rankings do banco.
- Views foram escritas com subconsultas agregadas para evitar multiplicacao de valores por joins.

Validacao local:
- SQL aplicado com sucesso no Supabase.
- Dashboard carregou 21.575 clientes totais, 50 ativos em 90 dias, 21.525 inativos em 90 dias e 20.921 sem vendedor.
- Relatorios abriu com 3 linhas de produtividade comercial.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar tela "Inbox Rodobens" e/ou corrigir classificacao de origem caso o arquivo atual ainda tenha todos os clientes como Capital Truck.

### 2026-05-28 - Inbox Rodobens e reclassificacao inicial

Status: concluido.

Entregue:
- Criada tela `Inbox Rodobens` no menu.
- Criado carregamento paginado de leads Rodobens via `listRodobensLeads`.
- Tela mostra fila de primeiro contato, ficha, WhatsApp e acao para registrar contato/follow-up.
- Importador local e Edge Function passaram a inferir `origem_base = rodobens` quando o bruto do arquivo contem Rodobens.
- Criado SQL `reclassify_rodobens_origin.sql` para corrigir a base atual.

Validacao local:
- A base atual possuia apenas 2 registros com texto bruto Rodobens.
- Esses 2 clientes foram reclassificados para `origem_base = rodobens`.
- Dashboard passou a contar 2 Rodobens e 21.573 Capital.
- Inbox Rodobens abriu com 2 leads.
- Build passou com `npm run build`.

Observacao:
- A base atual nao parece trazer uma origem Rodobens ampla; os dois casos encontrados sao empresas com Rodobens no proprio nome. Para separar todos os clientes vindos de uma base Rodobens, o arquivo de importacao precisa trazer esse sinal em alguma coluna, nome de arquivo, aba ou metadado.

### 2026-05-28 - Editor dedicado de proposta/orcamento

Status: concluido.

Entregue:
- Botao `Orcamento` na ficha do cliente passou a abrir uma tela dedicada de proposta.
- Editor tem cabecalho do cliente, validade, previsao de fechamento, condicao comercial, busca no catalogo, linhas de itens, quantidade, preco, desconto e total.
- Mensagem WA.ME e preview de proposta sao gerados pela tela.
- Criacao salva orcamento, itens, condicao, observacao e registra interacao comercial.
- Layout responsivo para desktop/mobile.

Validacao local:
- Login como Wagner Fonseca.
- Abertura da tela de proposta a partir da ficha de cliente.
- Item `ALINHAMENTO` selecionado do catalogo.
- 2 unidades com 10% de desconto calcularam total de R$ 234.
- Orcamento foi criado no Supabase e depois removido como limpeza de teste.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Adicionar versoes/status da proposta, aprovacao de desconto e modelo formatado para impressao/PDF.

### 2026-05-28 - Preview profissional e controles da proposta

Status: concluido.

Entregue:
- Editor de proposta recebeu preview comercial formatado.
- Botao `Imprimir/PDF` usa o modo de impressao do navegador com CSS dedicado.
- Botao `Copiar mensagem` copia a mensagem WA.ME.
- Resumo da proposta mostra status de aprovacao.
- Alerta de aprovacao aparece quando desconto supera o limite maximo vindo do catalogo.

Validacao local:
- Abertura do editor a partir de cliente.
- Item do catalogo selecionado.
- Preview exibiu Capital Truck Center, cliente, item, total, condicao e validade.
- Copia da mensagem exibiu confirmacao.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Persistir fluxo de aprovacao de desconto no banco e criar status `aguardando_aprovacao` para orcamentos.

### 2026-05-28 - Status de aprovacao de desconto

Status: concluido.

Entregue:
- Tipo de orcamento passou a aceitar `aguardando_aprovacao`.
- Schema recebeu `aprovacao_motivo`, `aprovado_por` e `aprovado_em`.
- Repository salva e mapeia os campos de aprovacao.
- Editor cria orcamento como `aguardando_aprovacao` quando houver desconto acima do limite do catalogo.
- Tela de orcamentos mostra o novo status e o motivo de aprovacao.

Validacao:
- SQL aplicado no Supabase.
- Build passou com `npm run build`.
- Teste direto no Supabase criou orcamento `aguardando_aprovacao` com motivo e removeu o registro depois.

Observacao:
- A lista de precos atual ainda nao possui `desconto_maximo`; o alerta esta pronto e sera ativado automaticamente quando esse campo vier preenchido na importacao.

### 2026-05-28 - Acao gerencial para aprovar proposta

Status: concluido.

Entregue:
- Repository de orcamentos passou a gravar `aprovado_por` e `aprovado_em` ao mudar status para `enviado`.
- Tela de orcamentos mostra contador de propostas aguardando aprovacao.
- Admin consegue acionar `Aprovar e enviar` em propostas com status `aguardando_aprovacao`.
- A listagem exibe motivo de aprovacao e data de aprovacao.

Validacao:
- Build passou com `npm run build`.
- SQL incremental aplicado no Supabase e tabela `orcamento_versoes` validada.
- Teste no Supabase criou orcamento `aguardando_aprovacao`, mudou para `enviado`, gravou `aprovado_por` e `aprovado_em`, e removeu o teste depois.

Proximo passo tecnico:
- Criar historico dedicado de aprovacoes e permitir rejeitar solicitacao com motivo.

### 2026-05-28 - Snapshot de versao de proposta

Status: concluido.

Entregue:
- Criada tabela `orcamento_versoes` para guardar versoes de proposta por orcamento.
- Cada novo orcamento registra a primeira versao com status, total, validade, condicao, origem, mensagem WhatsApp e itens em JSON.
- Repository grava a versao sem bloquear a criacao do orcamento caso o schema ainda nao tenha sido aplicado.
- Schema principal e schema incremental receberam tabela, indice e politicas RLS por vendedor/admin.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar tela de consulta/comparacao de versoes e registrar novas versoes quando uma proposta for editada/revisada.

### 2026-05-28 - Consulta de versoes de proposta

Status: concluido.

Entregue:
- Tela de orcamentos ganhou acao `Versoes` por proposta.
- Painel mostra cliente, vendedor, versoes registradas, primeira/ultima versao e diferenca contra o valor atual.
- Cada versao lista itens, total, condicao, validade, origem e mensagem WhatsApp gravada.
- Repository passou a carregar `orcamento_versoes` com fallback seguro quando a tabela ainda nao existir no ambiente local/mock.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar fluxo de revisar proposta existente salvando uma nova versao antes de alterar itens/condicoes.

### 2026-05-28 - Revisao de proposta com nova versao

Status: concluido.

Entregue:
- Tela de orcamentos ganhou acao `Revisar`.
- A revisao carrega itens atuais, validade, previsao de fechamento, condicao e observacoes.
- Ao salvar, o repository atualiza o orcamento, substitui os itens atuais e registra nova versao em `orcamento_versoes`.
- A proposta revisada volta para `negociando`, ou `aguardando_aprovacao` quando houver desconto acima do limite do catalogo.
- Apos salvar, o painel abre o historico de versoes para conferir a proposta revisada.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Atribuir receita de campanhas quando uma proposta originada de campanha virar `ganho`.

### 2026-05-28 - Receita atribuida por campanha

Status: concluido.

Entregue:
- `campanha_envios` recebeu `orcamento_id` e `receita_atribuida`.
- Quando um orcamento nasce de uma campanha salva, o envio guarda o ID do orcamento.
- Quando esse orcamento vira `ganho`, o envio da campanha passa para `ganhou`, marca venda e grava a receita atribuida.
- Resumo de campanhas passou a buscar e exibir receita atribuida.
- SQL incremental aplicado no Supabase e colunas validadas.

Validacao:
- Build passou com `npm run build`.
- `reference_import_schema.sql` aplicado no Supabase.

Proximo passo tecnico:
- Avancar para performance global por modulo: paginar orcamentos/tarefas/campanhas por query, em vez de carregar payloads completos.

### 2026-05-28 - Orcamentos paginados por query

Status: concluido.

Entregue:
- Repository de orcamentos ganhou `listOrcamentosPage` com pagina, status, vencidos e filtro por vendedor.
- Carga inicial de orcamentos foi limitada a contexto recente para reduzir payload do login.
- Tela de orcamentos passou a carregar paginas de 50 registros diretamente do Supabase.
- Filtro de status agora dispara consulta remota e reseta para a primeira pagina.
- Listagem traz nome do cliente/vendedor junto do orcamento, sem depender da pagina atual de clientes.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Paginar tarefas por query e mover filtros de rotina para o Supabase.

### 2026-05-28 - Tarefas paginadas por query

Status: concluido.

Entregue:
- Repository de tarefas ganhou `listTarefasPage` com pagina, status, origem e vendedor.
- Carga inicial de tarefas foi limitada a contexto recente.
- Tela de tarefas passou a carregar paginas de 50 registros direto do Supabase.
- Filtros de status, origem e vendedor agora disparam query remota e voltam para a primeira pagina.
- Vendedores veem apenas suas tarefas pela query; admin pode filtrar por qualquer vendedor.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Otimizar campanhas com resumo por view/query, reduzindo nested payload em `campanha_envios`.

### 2026-05-28 - Resumo de campanhas por view agregada

Status: concluido.

Entregue:
- Criada `vw_campanhas_resumo` com totais de envios, respostas, orcamentos, ganhos, perdas e receita atribuida.
- Repository de campanhas passou a consultar a view, evitando carregar `campanha_envios` aninhado.
- Mantido fallback para o metodo antigo caso um ambiente ainda esteja sem a view.
- Schema principal e incremental atualizados.

Validacao:
- Build passou com `npm run build`.
- `reference_import_schema.sql` aplicado no Supabase.
- View validada com consulta direta em `public.vw_campanhas_resumo`.

Proximo passo tecnico:
- Revisar relatorios para garantir que telas gerenciais usem views agregadas e nao arrays carregados no browser.

### 2026-05-28 - Cargas auxiliares limitadas para relatorios

Status: concluido.

Entregue:
- Relatorios seguem priorizando `vw_dashboard_resumo`, `vw_vendedores_resumo` e rankings agregados.
- Carga inicial de interacoes limitada aos 200 registros mais recentes.
- Carga inicial de importacoes limitada aos 100 registros mais recentes.
- Carga inicial de conflitos limitada aos 200 registros mais relevantes.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Revisar estados de loading por tela para garantir vazio/carregando claro, sem fallback falso.

### 2026-05-28 - Fechamento Q04 performance global

Status: concluido.

Entregue:
- Removida queda para cliente demonstrativo quando Supabase esta ativo e nenhum cliente foi carregado.
- Telas dependentes de cliente exibem estado vazio real quando nao ha cliente selecionado.
- Q04 marcado como concluido apos paginacao de orcamentos, paginacao de tarefas, resumo agregado de campanhas, relatorios por views e cargas auxiliares limitadas.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Avancar para Q05: gestao de carteira por vendedor.

### 2026-05-28 - Tela gerencial de vendedores

Status: concluido.

Entregue:
- Criada navegação `Vendedores`, separando gestão comercial de `Usuarios`.
- Resumo por vendedor mostra clientes, clientes em risco, tarefas vencidas, pipeline, contatos e cobertura.
- Filtros de carteira por responsavel atual, vendedor historico, cidade, origem e status.
- Clientes sem vendedor aparecem no consolidado e a tela sugere o vendedor com menor carga.
- Atribuicao de cliente para vendedor pode ser feita diretamente na lista filtrada.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Evoluir a tela para buscar clientes por query paginada propria e expor vendedor historico importado de forma dedicada.

### 2026-05-28 - Carteira de vendedores paginada

Status: concluido.

Entregue:
- Repository de clientes passou a mapear `vendedor_nome_erp` e `vendedor_codigo_erp`.
- Status comercial agora e convertido do banco para labels reais do app, em vez de sempre `Novo`.
- `listClientesPage` ganhou filtros por vendedor historico e status comercial.
- Tela `Vendedores` passou a buscar clientes por query paginada propria, com 50 por pagina.
- Lista diferencia responsavel atual (`users.nome`) de vendedor historico do ERP/importacao.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar resumo agregado por vendedor historico do ERP e acoes em lote para redistribuir clientes filtrados.

### 2026-05-28 - Historico ERP e redistribuicao em lote

Status: concluido.

Entregue:
- Criada `vw_vendedores_historicos_resumo` com clientes, sem responsavel, Capital, Rodobens, risco e total comprado por vendedor historico.
- Tela `Vendedores` exibe o resumo do vendedor historico importado do ERP.
- Repository ganhou `assignClientesVendedorByFilter` para redistribuir todos os clientes de um filtro para um responsavel atual.
- Tela `Vendedores` ganhou acao `Atribuir filtro` para redistribuicao em lote.
- Q05 marcado como concluido.

Validacao:
- Build passou com `npm run build`.
- `reference_import_schema.sql` aplicado no Supabase.
- View validada com 52 vendedores historicos e 21575 clientes agregados.

Proximo passo tecnico:
- Avancar para Q06: ficha 360 acionavel com veiculos, campanhas, tarefas e acoes contextuais.

### 2026-05-28 - Campanhas com construtor de publico

Status: concluido.

Entregue:
- Campanhas deixaram de depender da amostra de clientes carregada na tela.
- Segmentos base: reativacao 90 dias, primeiro contato Rodobens, sem contato 60 dias e higiene de cadastro sem WhatsApp.
- Filtros combinaveis por cidade, UF/regiao, vendedor e produto/servico comprado.
- Busca de compradores em vendas de produtos e servicos por codigo, nome, marca, modelo, medida, servico, observacao ou placa.
- Paginacao de 50 contatos por vez, mantendo status de envio por campanha/cliente.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Salvar segmentos personalizados com nome, filtros, template e responsavel.
- Permitir selecao assistida de varios produtos/servicos pelo catalogo, em vez de campo livre.
- Criar relatorio de campanha com alcance, respostas, orcamentos, vendas e receita atribuida.

### 2026-05-28 - Campanhas salvas reutilizaveis

Status: concluido.

Entregue:
- Campanhas podem ser salvas com nome, filtros e mensagem modelo.
- Tela permite reaplicar campanhas salvas sem remontar filtros manualmente.
- Status dos envios passa a ser lido pelo ID da campanha salva, evitando conflito por nome duplicado.
- Campanhas automaticas antigas nao entram como campanha salva quando nao possuem `segmentoId`.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Trocar campo livre de produto/servico por seletor assistido do catalogo.
- Adicionar relatorio de campanha com totais globais, respostas, orcamentos e conversao.

### 2026-05-28 - Relatorio global de campanhas

Status: concluido.

Entregue:
- Campanhas salvas exibem resumo global, separado da pagina atual de contatos.
- Resumo mostra alcance, enviados, respostas, orcamentos e taxa de conversao.
- Historico mostra as campanhas recentes com envios, respostas, orcamentos e conversao.
- Ao marcar envio/resposta/orcamento, o resumo e atualizado novamente pelo Supabase.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Relacionar campanha com orcamentos reais criados, para medir receita atribuida.
- Adicionar status `ganhou/perdeu/nao_contatar` na fila de campanha.

### 2026-05-28 - Fechamento comercial da campanha

Status: concluido.

Entregue:
- Fila de campanha ganhou status finais: `ganhou`, `perdido` e `nao_contatar`.
- `ganhou` passa a contar como venda ganha no resumo da campanha.
- `nao_contatar` atualiza tambem o status comercial do cliente.
- Contato de campanha pode abrir o editor de orcamento diretamente, mantendo o retorno para campanhas.
- Resumo da campanha passou a exibir ganhos e perdidos.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Vincular o orcamento criado pela campanha ao envio/campanha para medir receita atribuida automaticamente.

### 2026-05-28 - Fila inteligente de rotina comercial

Status: concluido.

Entregue:
- Tela de tarefas ganhou uma fila inteligente antes da lista manual.
- Sugere acoes para orcamentos vencidos, orcamentos vencendo, primeiro contato Rodobens e clientes em risco sem compra.
- Evita sugestao quando ja existe tarefa aberta da mesma origem para o cliente.
- Cada sugestao permite abrir ficha, abrir orcamento quando fizer sentido e criar tarefa com um clique.
- Agenda passou a contar tambem blocos de orcamentos e Rodobens.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Mover a fila inteligente para queries/views no Supabase, para enxergar toda a base sem depender da pagina atual de clientes.
- Criar visao gerente por vendedor com SLA, atraso e conversao de tarefa em orcamento/venda.

### 2026-05-28 - Orcamento com condicoes e follow-up

Status: concluido.

Entregue:
- Editor de orcamento passou a calcular condicoes comerciais comparativas: a vista, 30 dias, 30/60, 30/60/90 e cartao.
- Cada condicao permite ajuste percentual proprio, positivo ou negativo.
- Preview da proposta e mensagem WhatsApp mostram os valores por prazo.
- Ao criar um orcamento, o sistema cria automaticamente uma tarefa de follow-up.
- Follow-up usa a previsao de fechamento quando informada, ou D+2 como padrao.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Persistir versoes de proposta e condicoes comerciais estruturadas em tabela propria.
- Criar acao "Criar e enviar" para marcar status `enviado` e gerar follow-up de envio.

### 2026-05-28 - Criar e enviar orcamento

Status: concluido.

Entregue:
- Editor de orcamento recebeu acao `Criar e enviar`.
- Quando a proposta nao exige aprovacao, essa acao salva o orcamento com status `enviado`.
- Quando ha desconto acima do limite, a acao de envio fica bloqueada e o fluxo segue para aprovacao.
- Ao criar e enviar, a tarefa gerada passa a ser `Follow-up de proposta enviada`, com origem `orcamento:envio`.
- Se o cliente possui WhatsApp, o link WA.ME abre automaticamente apos salvar.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Vincular o orcamento criado pela tela a campanha/tarefa de origem.

### 2026-05-28 - Rejeicao e perda estruturada de orcamento

Status: concluido.

Entregue:
- Admin pode rejeitar uma proposta em aprovacao com motivo padronizado.
- Rejeicao grava o orcamento como `perdido` com motivo `aprovacao_rejeitada`.
- Perda comum agora exige motivo selecionado antes de habilitar a acao.
- Listagem mostra o motivo de perda/rejeicao em texto legivel.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar historico dedicado de aprovacoes/rejeicoes em tabela propria.
- Vincular orcamento a campanha/tarefa de origem.

### 2026-05-28 - Origem comercial do orcamento

Status: concluido.

Entregue:
- Editor de orcamento recebe o contexto de origem: cliente, tarefa ou campanha.
- Origem fica visivel no cabecalho da proposta.
- Observacao/interacao do orcamento passa a registrar a origem comercial.
- Quando o orcamento nasce de uma campanha salva, o envio da campanha e marcado como `virou_orcamento`.
- Quando o orcamento nasce de uma sugestao de tarefa, a proposta guarda o contexto da tarefa que originou a acao.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar colunas/tabela para vinculo forte `orcamento_origem`, em vez de guardar apenas na observacao.

### 2026-05-28 - Ficha 360 com veiculos e resumo executivo

Status: concluido.

Entregue:
- A Ficha 360 passou a carregar veiculos do cliente sob demanda, sem puxar a base inteira.
- Aba `Veiculos` mostra placa/chassi, descricao, ultimo KM, ultimo atendimento, quantidade de registros e valor vinculado.
- Vendas e servicos exibem KM/observacao de veiculo quando os dados vierem da importacao.
- Resumo executivo passou a mostrar frequencia media, proxima recompra sugerida, produto principal e servico recorrente.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Adicionar abas de tarefas e campanhas dentro da Ficha 360, com acoes diretas para criar tarefa, campanha ou orcamento a partir do historico.

### 2026-05-28 - Ficha 360 com tarefas e campanhas

Status: concluido.

Entregue:
- A Ficha 360 passou a carregar tarefas e envios de campanha do cliente sob demanda.
- Nova aba `Tarefas` mostra vencimento, origem, status, responsavel e permite criar nova tarefa a partir da ficha.
- Nova aba `Campanhas` mostra campanha, status, telefone, orcamento gerado e receita atribuida.
- Acoes rapidas no topo da ficha permitem criar orcamento e criar tarefa contextual.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar acoes avancadas por item de historico: repetir compra, gerar orcamento com item anterior e iniciar campanha a partir do cliente.

### 2026-05-28 - Orcamento a partir do historico

Status: concluido.

Entregue:
- Vendas e servicos dentro da Ficha 360 ganharam acao `Orcar`.
- Ao clicar em `Orcar`, o editor de proposta abre com o item historico ja preenchido.
- O item preserva codigo, descricao, tipo, quantidade, valor unitario e observacao de origem.
- A proposta continua usando o fluxo normal de validade, condicoes, aprovacao, WhatsApp e follow-up.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Permitir selecionar multiplos itens historicos antes de abrir a proposta, para repetir compras completas.

### 2026-05-28 - Fila inteligente global no Supabase

Status: concluido.

Entregue:
- A view `oportunidades_clientes` foi recriada no Supabase com `security_invoker`, respeitando RLS.
- Oportunidades agora sao calculadas na base inteira: Rodobens sem contato, clientes em risco, recompra, orcamento aberto/vencido, sem vendedor, sem WhatsApp e alto valor sem contato.
- A tela `Oportunidades` passou a usar repository paginado, com filtros de ativas, bloqueadas e todas.
- Oportunidade com tarefa aberta da mesma origem aparece bloqueada para evitar duplicidade.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/oportunidades_clientes_global.sql`.
- Build passou com `npm run build`.
- Consulta de validacao retornou oportunidades globais por tipo.

Proximo passo tecnico:
- Transformar essa fila em painel gerencial com agrupamento por vendedor/origem e acoes em lote.

### 2026-05-28 - Tela de catalogo profissional

Status: concluido.

Entregue:
- Novo modulo `Catalogo` no menu principal.
- Consulta paginada no Supabase para produtos e servicos ativos.
- Busca por codigo, descricao, marca, grupo e subgrupo.
- Filtro por produto/servico e visualizacao de preco, desconto maximo e estoque.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Adicionar historico de vigencia de preco e itens inativos, preparando revisao de mudancas de tabela.

### 2026-05-28 - Historico de preco no catalogo

Status: concluido.

Entregue:
- Cada item do catalogo ganhou acao `Historico`.
- O historico consulta `catalogo_precos` sob demanda, sem carregar todos os precos.
- A tabela mostra vigencia, preco, desconto maximo, estoque e arquivo/importacao de origem quando houver.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Exibir produtos/servicos inativos e criar indicador de mudanca de preco entre importacoes.

### 2026-05-28 - Importacao incremental de precos

Status: concluido.

Entregue:
- Importacao de `precoprodutos` e `precoservicos` agora compara com o ultimo preco do item.
- Nova vigencia em `catalogo_precos` so e criada quando preco, desconto maximo ou estoque mudam.
- Resultado da importacao mostra precos novos, alterados e inalterados.
- Script local de importacao e Edge Function foram atualizados com a mesma regra.

Validacao:
- Build passou com `npm run build`.
- Edge Function `import-reference-files` foi publicada no Supabase.

Proximo passo tecnico:
- Criar painel de qualidade de importacao com alertas de arquivos obrigatorios, conflitos e mudancas de preco.

### 2026-05-28 - Painel de saude da base

Status: concluido.

Entregue:
- Tela de importacoes ganhou painel `Saude da base`.
- Resumo mostra ultima importacao, arquivos obrigatorios reconhecidos, conflitos pendentes e clientes sem vendedor.
- Detalhes mostram clientes sem WhatsApp, origem desconhecida e status da ultima importacao.
- Dados sao calculados diretamente no Supabase, sem depender de clientes carregados na tela.

Validacao:
- Build passou com `npm run build`.
- Consulta direta no Supabase validou: ultima importacao processada, 1077 clientes sem WhatsApp, 20921 sem vendedor, 0 origem desconhecida e 0 conflitos pendentes.

Proximo passo tecnico:
- Evoluir para historico de qualidade por importacao: linhas novas/ignoradas/atualizadas e mudancas de preco por arquivo.

### 2026-05-28 - Funil gerencial por vendedor

Status: concluido.

Entregue:
- Criada view `vw_funil_gerencial` no Supabase com `security_invoker`.
- Relatorios agora mostram funil dos ultimos 30 dias por vendedor: clientes, leads Rodobens, contatos, orcamentos, ganhos, perdas, pipeline e tempo medio de fechamento.
- Agregado roda no banco, sem depender de carregar clientes/orcamentos inteiros no browser.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/funil_gerencial.sql`.
- Build passou com `npm run build`.
- Consulta direta validou linhas por vendedor, incluindo carteira sem vendedor.

Proximo passo tecnico:
- Adicionar motivos de perda e atividades feitas no dia ao relatorio gerencial.

### 2026-05-28 - Motivos de perda e atividades do dia

Status: concluido.

Entregue:
- Substituido o SQL isolado do funil por `relatorios_gerenciais.sql`, concentrando as views gerenciais.
- Corrigida a view `vw_funil_gerencial` para agregar clientes, contatos, orcamentos e tarefas em CTEs separadas, evitando inflar valores por combinacao de joins.
- Criadas as views `vw_motivos_perda` e `vw_atividades_dia` com `security_invoker`.
- Relatorios agora exibem motivos de perda e atividade diaria por vendedor alem do funil.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/relatorios_gerenciais.sql`.
- Build passou com `npm run build`.
- Consulta direta validou funil por vendedor, motivos de perda sem registros no momento e atividades do dia para Mateus, Wagner e William.

Proximo passo tecnico:
- Evoluir relatorios para filtros de periodo/vendedor e exportacao gerencial.

### 2026-05-28 - Inbox Rodobens com qualificacao

Status: concluido.

Entregue:
- Adicionados campos de qualificacao Rodobens em `clientes`: status, observacao e data de qualificacao.
- Criada view `vw_rodobens_funil` com totais por status, WhatsApp preenchido e vendedor responsavel.
- Inbox Rodobens ganhou filtro por status, cards de funil e acoes para registrar contato, qualificar, converter em cliente Capital e descartar.
- Conversao para cliente muda `origem_base` para `capital_truck`; status `nao_contatar` sincroniza o status comercial.
- Auditoria passou a registrar mudanca de qualificacao Rodobens e alteracao de origem.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/rodobens_qualificacao.sql`.
- Build passou com `npm run build`.
- Consulta direta em `vw_rodobens_funil` retornou 2 leads Rodobens em `novo`, ambos com WhatsApp e sem vendedor.

Proximo passo tecnico:
- Criar relatorio de conversao Rodobens por periodo/vendedor e reforcar a classificacao de origem pela importacao.

### 2026-05-28 - Campanhas com meta, custo e ROI

Status: concluido.

Entregue:
- Adicionados `objetivo`, `custo_estimado` e `meta_receita` em campanhas.
- View `vw_campanhas_resumo` passou a retornar custo, meta, receita atribuida e ROI percentual.
- Tela de Campanhas agora permite salvar objetivo, custo estimado e meta de receita junto dos filtros e mensagem.
- Resumo da campanha exibe custo, meta e ROI usando dados agregados do Supabase.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/campanhas_roi.sql`.
- Build passou com `npm run build`.
- Consulta direta em `vw_campanhas_resumo` validou as novas colunas; sem linhas porque nao havia campanhas salvas com segmento no banco no momento.

Proximo passo tecnico:
- Adicionar seletor assistido de produtos/servicos do catalogo e janela minima entre campanhas por cliente.

### 2026-05-28 - Catalogo com status e sugestoes complementares

Status: concluido.

Entregue:
- Catalogo agora permite filtrar itens ativos, inativos ou todos.
- Tipo `CatalogoItem` passou a carregar o status `ativo` vindo do Supabase.
- Criada funcao `catalogo_sugestoes_complementares(item_id, limite)` para recomendar itens comprados em conjunto por clientes reais.
- Historico de preco do item passou a mostrar sugestoes complementares, com ocorrencias e quantidade de clientes.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/catalogo_profissional.sql`.
- Build passou com `npm run build`.
- Consulta direta validou sugestoes reais para pneu `000020017`, retornando alinhamento, balanceamento, montagem, troca de pneu e cambagem.

Proximo passo tecnico:
- Usar as sugestoes complementares diretamente no editor de orcamento e nas campanhas por produto.

### 2026-05-28 - Sugestoes de catalogo no orcamento

Status: concluido.

Entregue:
- Editor de orcamento passou a filtrar apenas itens ativos do catalogo.
- Ao selecionar um item de catalogo, o editor consulta `catalogo_sugestoes_complementares`.
- Sugestoes complementares aparecem dentro da proposta e podem ser adicionadas como novo item em um clique.
- Essa logica usa historico real de vendas/servicos para sugerir cross-sell, como alinhamento e balanceamento para pneus.

Validacao:
- Build passou com `npm run build`.

Proximo passo tecnico:
- Levar a mesma inteligencia para criacao de campanhas por produto e para repeticao de compra na Ficha 360.

### 2026-05-28 - Indicadores de deduplicacao na importacao

Status: concluido.

Entregue:
- Tipo `Importacao` passou a carregar `itensCriados` e `itensIgnorados`.
- Painel de Saude da base mostra linhas recentes, itens novos, ignorados/repetidos e clientes novos.
- Cada card de importacao agora exibe criados e ignorados, facilitando ver reprocessamento sem abrir SQL.

Validacao:
- Build passou com `npm run build`.
- Consulta direta em `importacoes` validou registros com `itens_criados` e `itens_ignorados`, incluindo uma importacao pequena com 26 criados e 14 ignorados.

Proximo passo tecnico:
- Criar tendencia de mudancas de preco por importacao e painel de possiveis duplicados.

### 2026-05-28 - Auditoria local com Playwright e pesquisa de ferramentas

Status: concluido.

Entregue:
- Rodada local do app com login admin e navegacao pelas principais telas.
- Validado login Supabase dos tres usuarios; William nao possui clientes atribuidos no momento.
- Identificado e corrigido erro de Orcamentos por relacionamento ambiguo com `users`.
- Criado documento `AUDITORIA_LOCAL_E_ROADMAP_FERRAMENTAS_2026-05-28.md` com achados, riscos e ferramentas prioritarias.
- Pesquisa comparativa usada para orientar roadmap: Salesforce Automotive Cloud, Zoho Automotive CRM/CPQ, YardCRM e sistema de inventario/cotacao de pneus.

Validacao:
- Build passou com `npm run build`.
- Consulta autenticada de Orcamentos passou sem erro apos selecionar explicitamente `users!orcamentos_vendedor_id_fkey(nome)`.
- Playwright confirmou navegacao local nas telas principais.

Proximo passo tecnico:
- Implementar central de erros por modulo e substituir metricas calculadas sobre pagina atual por views agregadas.

### 2026-05-28 - Erros por modulo e oportunidades resumidas

Status: concluido.

Entregue:
- Substituido o erro global unico por mapa de erros por modulo.
- Erros de Clientes, Orcamentos, Tarefas, Oportunidades, Catalogo, Rodobens, Ficha 360, Vendedores e Usuarios nao contaminam mais outras telas.
- Tela de Usuarios passou a usar agregados reais de `vendedoresResumo` para total de carteira e risco.
- Criada view `vw_oportunidades_resumo` com totais, ativas, bloqueadas e prioridade por tipo.
- Tela de Oportunidades ganhou cards de resumo por tipo e usa contagem planejada na listagem paginada.
- Oportunidades agora podem ser filtradas por tipo: sem vendedor, recompra, risco, sem WhatsApp, Rodobens, orcamento etc.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/oportunidades_resumo.sql`.
- Build passou com `npm run build`.
- Playwright validou que erro de Orcamentos nao vaza para Catalogo, Usuarios mostra Mateus com 652 clientes e Oportunidades carrega 50 linhas com cards/filtro por tipo.

Proximo passo tecnico:
- Materializar ou otimizar a view de oportunidades para reduzir o tempo de primeira resposta e criar filtros por tipo de oportunidade.

### 2026-05-28 - Oportunidades em cache operacional

Status: concluido.

Entregue:
- Criada tabela `oportunidades_cache` com chave por cliente/tipo e indices para status, tipo, vendedor e geracao.
- Criada funcao `refresh_oportunidades_cache()` para recalcular a fila a partir das regras atuais de oportunidade.
- Criada view `vw_oportunidades_resumo_cache` para cards de resumo sem depender da view pesada original.
- Tela de Oportunidades passou a consultar o cache, com paginacao de 50, contagem exata, filtro por tipo e botao admin `Atualizar fila`.
- Criada funcao `marcar_oportunidade_com_tarefa()`; ao transformar oportunidade em tarefa, o cache ja marca `tarefa_existente` e evita repetir a acao.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/oportunidades_cache.sql`.
- Consulta autenticada como Wagner retornou 50 registros paginados e 43.605 oportunidades ativas no cache.
- Playwright local validou a tela `Oportunidades`, o botao `Atualizar fila`, cards por tipo e linhas de acao.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Disparar `refresh_oportunidades_cache()` automaticamente ao terminar a importacao diaria e apos reprocessamentos grandes.
- Evoluir Dashboard para usar somente agregados de banco, sem depender da pagina atual de clientes.

### 2026-05-28 - Pos-processamento automatico da importacao diaria

Status: concluido.

Entregue:
- Criada funcao `refresh_clientes_comercial_stats()` para recalcular primeira compra, ultima compra, ultimo servico, total comprado, total de servicos e status comercial.
- Criada funcao `finalizar_importacao_diaria()` para executar, em sequencia, estatisticas comerciais e refresh da fila `oportunidades_cache`.
- Edge Function `import-reference-files` passou a chamar o pos-processamento antes de retornar sucesso.
- Script local `import-reference-files-to-supabase.mjs` passou a usar a mesma funcao de finalizacao, evitando divergencia entre importacao pelo app e importacao por terminal.
- Tela de Importacoes agora mostra quantos clientes foram recalculados e quantas oportunidades ficaram na fila.
- Tela de Saude da base ganhou acao admin `Reprocessar fechamento` para recalcular clientes e oportunidades sem reenviar arquivos.
- Script de deploy da Edge Function passou a usar `npx supabase`, sem depender de CLI global.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/importacao_postprocess.sql`.
- Chamada direta de `finalizar_importacao_diaria()` retornou 21.575 clientes recalculados e 43.605 oportunidades geradas.
- Edge Function `import-reference-files` foi redeployada no projeto Supabase.

Proximo passo tecnico:
- Criar uma tela/acao de manutencao para reprocessar pos-importacao manualmente se a Edge Function cair no meio de uma importacao grande.
- Evoluir o Dashboard para alertar quando a fila de oportunidades estiver desatualizada.

### 2026-05-28 - Dashboard com fila comercial agregada

Status: concluido.

Entregue:
- View `vw_dashboard_resumo` passou a expor `oportunidades_ativas`, `oportunidades_total` e `oportunidades_atualizado_em`.
- Dashboard deixou de depender da lista local/tela de oportunidades para mostrar o total de oportunidades.
- Dashboard ganhou card de fila total e mostra quando a fila foi recalculada.
- Saude da base passou a mostrar oportunidades ativas, data de recalc da fila e alerta de fechamento pendente quando a fila estiver mais antiga que a ultima importacao.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/dashboard_summary_views.sql`.
- Consulta direta retornou 43.605 oportunidades ativas e 43.605 totais no agregado.
- Build passou com `npm run build`.
- Playwright local validou Dashboard com oportunidades reais e Saude da Base com 4/4 arquivos obrigatorios, 20.921 sem vendedor e 43.605 oportunidades.

Proximo passo tecnico:
- Criar painel gerencial de acoes prioritarias: sem vendedor, Rodobens sem contato, orcamentos vencidos e campanhas paradas, cada uma com atalho para a tela operacional.

### 2026-05-28 - Atalhos gerenciais de acoes prioritarias

Status: concluido.

Entregue:
- Dashboard ganhou painel `Acoes prioritarias` com atalhos para os gargalos operacionais principais.
- View `vw_dashboard_resumo` passou a expor contadores por tipo de oportunidade: sem vendedor, Rodobens e orcamento vencido.
- Atalho `Distribuir carteira` abre a fila de oportunidades ja filtrada em `sem_vendedor`.
- Atalho `Qualificar Rodobens` abre o Inbox Rodobens filtrado em novos.
- Atalho `Retomar propostas` abre Orcamentos vencidos.
- Atalho `Fila de campanhas` abre Campanhas.
- Atalho `Tarefas atrasadas` abre Tarefas vencidas.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/dashboard_summary_views.sql`.
- Consulta direta retornou 20.921 oportunidades sem vendedor, 2 Rodobens e 0 orcamentos vencidos.
- Build passou com `npm run build`.
- Playwright local validou o painel no Dashboard e o clique em `Distribuir carteira` abrindo Oportunidades filtradas.

Proximo passo tecnico:
- Transformar cada atalho em fluxo de acao em lote: atribuir vendedor, gerar campanha, criar tarefas em massa ou abrir proposta conforme o gargalo.

### 2026-05-28 - Atribuicao em lote na fila sem vendedor

Status: concluido.

Entregue:
- Motor de Oportunidades ganhou barra de acao em lote quando o filtro `Sem vendedor` esta ativo.
- Admin pode selecionar as oportunidades visiveis da pagina, escolher um vendedor e atribuir clientes em massa.
- Atribuicao em lote atualiza `clientes.vendedor_id`, recalcula `oportunidades_cache` e atualiza resumos de vendedores.
- O atalho `Distribuir carteira` do Dashboard leva direto para essa fila operacional.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou o fluxo sem gravar dados: abriu `Distribuir carteira`, exibiu seletor de vendedor, selecionou 50 clientes da pagina e habilitou `Atribuir 50`.

Proximo passo tecnico:
- Criar acoes em lote equivalentes para Rodobens, tarefas e campanhas: criar tarefas em massa e gerar campanha a partir da selecao.

### 2026-05-29 - Tarefas em lote para Rodobens

Status: concluido.

Entregue:
- Inbox Rodobens ganhou selecao de leads da pagina.
- Admin pode selecionar a pagina atual e criar tarefas de primeiro contato em lote.
- O lote cria tarefas com origem `rodobens:primeiro_contato`, prioridade 85 e vencimento no dia.
- O fluxo nao marca lead como contatado automaticamente; isso fica reservado para quando o contato de fato acontecer.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou o atalho `Qualificar Rodobens`, selecao de 2 leads e habilitacao de `Criar 2 tarefas`.

Proximo passo tecnico:
- Criar geracao de campanha a partir de selecao de oportunidades/leads e permitir acompanhar envio/resposta sem duplicar clientes.

### 2026-05-29 - Atualizacao em lote de campanhas

Status: concluido.

Entregue:
- Tela de Campanhas ganhou selecao de clientes da pagina.
- Admin pode selecionar a pagina atual e marcar os selecionados como `enviado` em lote.
- Admin tambem pode marcar selecionados como `nao_respondeu` em lote.
- Acoes em lote reaproveitam a mesma trilha de auditoria/interacao usada nas acoes individuais.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou selecao de 50 clientes na campanha e habilitacao de `Marcar 50 enviados`.
- O teste nao gravou envios reais.

Proximo passo tecnico:
- Criar campanhas salvas diretamente a partir de uma selecao feita em Oportunidades/Rodobens, preservando o segmento e evitando duplicidade por cliente.

### 2026-05-29 - Deduplicacao operacional de tarefas abertas

Status: concluido.

Entregue:
- Criado indice unico parcial `tarefas_abertas_cliente_origem_idx`.
- O banco passa a impedir duas tarefas abertas para o mesmo cliente e mesma origem operacional.
- `createTarefa` passou a usar upsert quando existe origem, atualizando a tarefa aberta em vez de duplicar.
- Isso protege os lotes de Rodobens, oportunidades e campanhas contra cliques repetidos/reprocessamentos.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/tarefas_deduplicacao.sql`.
- Consulta direta confirmou o indice `tarefas_abertas_cliente_origem_idx`.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar campanhas salvas diretamente a partir de uma selecao feita em Oportunidades/Rodobens, preservando o segmento e evitando duplicidade por cliente.

### 2026-05-29 - Deduplicacao de interacoes de campanha

Status: concluido.

Entregue:
- Criado indice unico `interacoes_campanha_cliente_resultado_idx` para impedir evento repetido por cliente/campanha/status.
- `InteracaoInput` passou a aceitar `campanhaId` e `orcamentoId`.
- Acoes de campanha agora registram a interacao vinculada ao ID real da campanha.
- `createInteracao` reaproveita interacao de campanha existente quando o mesmo status ja foi registrado, evitando timeline poluida em reprocessamento de lote.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/interacoes_campanha_deduplicacao.sql`.
- Consulta direta confirmou o indice no banco.
- Build passou com `npm run build`.

Proximo passo tecnico:
- Criar campanhas salvas diretamente a partir de uma selecao feita em Oportunidades/Rodobens, preservando o segmento e evitando duplicidade por cliente.

### 2026-05-29 - Campanhas a partir de selecao operacional

Status: concluido.

Entregue:
- O Motor de oportunidades ganhou selecao de oportunidades em qualquer tipo de fila.
- A selecao pode virar uma campanha salva real, com contatos pendentes ja registrados em `campanha_envios`.
- A Inbox Rodobens tambem pode transformar leads selecionados em campanha de primeiro contato.
- Campanhas criadas por selecao usam segmento `Selecao manual`, preservam os `clienteIds` originais no filtro salvo e reaparecem no modulo Campanhas sem remontar filtros.
- A deduplicacao nativa de `campanha_envios` por `campanha_id, cliente_id` impede repeticao dentro da mesma campanha.

Validacao:
- Build passou com `npm run build`.
- Playwright local confirmou os botoes `Gerar campanha` em Oportunidades e Inbox Rodobens e o segmento `Selecao manual` em Campanhas.

Proximo passo tecnico:
- Criar uma experiencia de follow-up de campanha mais gerencial: fila por status, SLA de resposta, criar orcamento/tarefa em lote e relatorio por vendedor.

### 2026-05-29 - Follow-up em lote de campanhas

Status: concluido.

Entregue:
- Tela de Campanhas ganhou acao em lote `Criar tarefas` para os contatos selecionados.
- As tarefas geradas respeitam o status atual do cliente na campanha: pendente, enviado, respondeu, sem resposta, virou orcamento, ganho, perdido ou nao contatar.
- Prioridade passa a ser calculada pelo status: respostas e orcamentos ficam no topo da fila.
- Origem da tarefa inclui a campanha e o status, permitindo deduplicacao por cliente/campanha/status sem misturar campanhas diferentes.
- Tarefa automatica de `virou_orcamento` tambem passou a carregar o ID real da campanha na origem.

Validacao:
- Build passou com `npm run build`.
- Playwright local abriu Campanhas, filtrou o segmento Rodobens com 2 clientes e confirmou os botoes `Selecionar pagina` e `Criar tarefas`.

Proximo passo tecnico:
- Evoluir relatorio por vendedor dentro de campanhas: enviados, respostas, tarefas abertas, orcamentos e receita atribuida por responsavel.

### 2026-05-29 - Cockpit diario do vendedor

Status: concluido - primeira versao.

Entregue:
- Nova tela `Cockpit` no menu principal e como destino inicial apos login.
- Carregamento enxuto com blocos de respostas de campanha, tarefas criticas, propostas vencidas, Rodobens novos e oportunidades.
- Acoes diretas para abrir Ficha 360, iniciar orcamento e concluir tarefas.
- Visao admin inclui carga por vendedor com tarefas, atrasos e respostas de campanha.
- Criado repository `listCampanhaInbox` para buscar respostas de campanhas sem carregar todos os envios.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou os blocos `Responder agora`, `Tarefas criticas`, `Propostas para retomar` e `Leads e oportunidades`.

Observacao:
- Durante a sessao local apareceram erros 500 ja existentes em views gerenciais (`vw_funil_gerencial` e `vw_ranking_servicos_recorrentes`), fora do fluxo novo do Cockpit. Devem entrar em uma rodada de saude das views gerenciais.

Proximo passo tecnico:
- Avancar para M02: SLA/follow-up com reagendamento, prazos por origem e alerta gerencial.

### 2026-05-29 - Reagendamento com motivo em tarefas

Status: concluido - primeira entrega do M02.

Entregue:
- Tabela `tarefas` recebeu `reagendada_em` e `reagendamento_motivo`.
- Criado SQL incremental `supabase/queries/tarefas_reagendamento.sql` e aplicado no Supabase.
- Repository ganhou `rescheduleTarefa`.
- Cockpit permite reagendar tarefa critica com motivo obrigatorio.
- Tela de Tarefas permite reagendar tarefas abertas inline.
- Tarefa passa a exibir motivo do reagendamento quando existir.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/tarefas_reagendamento.sql`.
- Build passou com `npm run build`.
- Playwright local validou o botao `Reagendar` e a abertura do modal no Cockpit.
- Registro temporario de teste foi removido do Supabase apos a validacao.

Proximo passo tecnico:
- Adicionar SLA visual por origem e alerta gerencial de tarefas criticas atrasadas por vendedor.

### 2026-05-29 - SLA visual por origem

Status: concluido.

Entregue:
- Criado calculo visual de SLA por origem da tarefa: campanha, orcamento, Rodobens, oportunidade, interacao ou generico.
- Cockpit passou a exibir selo de SLA em tarefas criticas: no prazo, no limite, vence hoje ou atrasada.
- Tela de Tarefas passou a exibir o mesmo selo junto ao vencimento.
- Carga por vendedor no Cockpit ganhou coluna `SLA critico`.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou selo `.sla-pill.danger` no Cockpit e em Tarefas.
- Registro temporario usado para teste foi removido do Supabase.

Proximo passo tecnico:
- Criar alertas gerenciais por vendedor com limite configuravel e/ou view agregada de SLA por responsavel.

### 2026-05-29 - SLA global por vendedor

Status: concluido.

Entregue:
- Criada view `vw_tarefas_sla_vendedor` com `security_invoker`.
- A view agrega tarefas abertas, atrasadas, vencendo hoje, alta prioridade e atrasos por origem: campanha, orcamento, Rodobens e oportunidade.
- Repository `listTarefasSlaVendedor` expoe o agregado para o frontend.
- Cockpit admin passou a usar esse agregado global na tabela `Carga por vendedor`, evitando depender apenas dos poucos itens carregados na tela.

Validacao:
- SQL aplicado com `node scripts/run-sql-file.mjs supabase/queries/tarefas_sla_vendedor.sql`.
- Build passou com `npm run build`.
- Playwright local validou `SLA critico` e origem critica no Cockpit.

Proximo passo tecnico:
- Criar alertas gerenciais configuraveis sobre a view de SLA e comecar automacoes adicionais de follow-up.

### 2026-05-29 - Alertas gerenciais de SLA

Status: concluido.

Entregue:
- Cockpit admin ganhou painel `Alertas de SLA`.
- Gerente pode ajustar o limite operacional da visao: 1+, 3+, 5+ ou 10+ atrasos/prioridades.
- Alertas mostram vendedor, origem critica predominante, atrasadas, vencem hoje e atalho para abrir a fila de tarefas.
- Quando ninguem passa do limite, a tela mostra estado vazio claro.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou painel `Alertas de SLA`, seletor de limite e exibicao de cards/estado vazio.

Proximo passo tecnico:
- Comecar automacoes adicionais de follow-up: criar tarefas quando orcamento vencer e quando campanha responder, com deduplicacao por origem.

### 2026-05-29 - Segmentacao avancada em campanhas

Status: concluido - primeira entrega do M07.

Entregue:
- Campanhas ganharam filtros combinaveis por origem da base, dias sem compra, dias sem contato, valor historico minimo e somente clientes com WhatsApp.
- O reposititorio de clientes passou a aplicar esses filtros diretamente no Supabase com paginacao, sem carregar a base inteira.
- O fallback local tambem respeita os mesmos filtros para desenvolvimento.
- Campanhas salvas preservam os filtros avancados dentro de `filtro_usado`.

Validacao:
- Build passou com `npm run build`.
- Playwright local confirmou login, abertura de Campanhas e uso dos novos filtros.

Proximo passo tecnico:
- Completar M07 com medida, vendedor historico, veiculo/KM/status de lead e criar view de elegibilidade com motivo de bloqueio.

### 2026-05-29 - Segmentacao por frota e historico

Status: concluido - segunda entrega do M07.

Entregue:
- Segmentador de campanhas ganhou filtros por vendedor historico, status de lead, medida, placa/veiculo, KM minimo e KM maximo.
- A resolucao do publico cruza IDs vindos de `vendas_itens`, `servicos_itens` e `veiculos`, intersectando com selecoes manuais quando existirem.
- O filtro por medida reaproveita a busca historica de produtos/servicos, permitindo campanhas como pneus 295/80 ou servicos especificos.

Validacao:
- Build passou com `npm run build`.
- Playwright local confirmou login, abertura de Campanhas e renderizacao/uso dos campos de frota, medida e lead.

Proximo passo tecnico:
- Criar view de elegibilidade de campanha por cliente com motivo de bloqueio, janela minima configuravel e opt-out auditavel.

### 2026-05-29 - Elegibilidade de campanha no banco

Status: concluido - primeira entrega do M08.

Entregue:
- Criada view `vw_clientes_campanha_elegibilidade` com `elegivel`, `motivo_bloqueio`, ultimo contato/campanha e proximo envio permitido.
- Regras cobertas: cliente/lead marcado como nao contatar, ausencia de WhatsApp e contato ou campanha recente nos ultimos 7 dias.
- Repository de campanhas passou a carregar elegibilidade para os clientes da pagina.
- Tela de Campanhas usa a elegibilidade do banco para bloquear selecao/envio e mantem fallback local quando a view nao estiver disponivel.

Validacao:
- SQL aplicado no Supabase com `node scripts/run-sql-file.mjs supabase/queries/campanha_elegibilidade.sql`.
- Build passou com `npm run build`.
- Playwright local confirmou Campanhas carregando sem erro na chamada da view de elegibilidade.

Proximo passo tecnico:
- Transformar a janela de 7 dias em configuracao de campanha/regra e criar opt-out auditavel com motivo, data e usuario.

### 2026-05-29 - Janela configuravel e opt-out auditavel

Status: concluido - segunda entrega do M08.

Entregue:
- Campanhas ganharam campo `Janela entre campanhas`, salvo em `filtro_usado.janelaMinimaDias`.
- O bloqueio de contato recente passou a respeitar a janela definida por campanha na tela.
- Cliente recebeu campos `whatsapp_opt_out_motivo`, `whatsapp_opt_out_em` e `whatsapp_opt_out_por`.
- Ao marcar `Nao contatar` em campanhas, o app pede motivo e grava a justificativa no cliente.
- A view de elegibilidade passou a expor motivo/data/usuario do opt-out.

Validacao:
- SQL aplicado no Supabase com `node scripts/run-sql-file.mjs supabase/queries/campanha_optout_governanca.sql`.
- Build passou com `npm run build`.
- Playwright local validou a tela de Campanhas, o campo de janela e a view de elegibilidade sem erros.

Proximo passo tecnico:
- Criar Inbox dedicado de respostas de campanha com classificacao de trabalho: pediu preco, pediu retorno, virar orcamento, ganho e perdido.

### 2026-05-29 - Inbox dedicado de campanhas

Status: concluido - primeira entrega do M09.

Entregue:
- Criada tela `Inbox Campanhas` no menu principal.
- Fila carrega `campanha_envios` real com filtro por status e vendedor.
- Cada item permite abrir Ficha 360, iniciar orcamento, criar tarefa, marcar ganho, perdido ou sem resposta.
- Mudancas de status registram interacao vinculada a campanha.

Validacao:
- Build passou com `npm run build`.
- Playwright local validou a abertura da tela pelo menu e carregamento da fila sem erro em `campanha_envios`.

Proximo passo tecnico:
- Criar relatorio de campanha por vendedor com enviados, respostas, tarefas, orcamentos, ganhos, receita e ROI.

### 2026-05-29 - Relatorio de campanha por vendedor

Status: concluido - primeira entrega do M14.

Entregue:
- Criada view `vw_campanhas_vendedor_resumo`.
- Relatorios ganhou painel `Campanhas por vendedor`.
- O painel mostra campanhas, envios, respostas, orcamentos, ganhos, tarefas abertas, receita atribuida e ROI por responsavel.

Validacao:
- SQL aplicado no Supabase com `node scripts/run-sql-file.mjs supabase/queries/campanhas_vendedor_resumo.sql`.
- Build passou com `npm run build`.
- Playwright local validou Relatorios e a chamada da view sem erro.

Proximo passo tecnico:
- Avancar para CPQ profissional: regras de desconto por grupo/produto/servico, aprovacao formal e documento final.

## Criterio de qualidade

Cada nova funcao so deve entrar como "pronta" se:

- usa dados reais do Supabase;
- nao depende de mock/fallback quando Supabase esta configurado;
- tem estado de carregamento claro;
- nao carrega a base inteira sem necessidade;
- registra auditoria/interacao quando muda status comercial;
- evita duplicidade em importacoes/campanhas/orcamentos;
- funciona para admin, gerente e vendedor respeitando permissao.
