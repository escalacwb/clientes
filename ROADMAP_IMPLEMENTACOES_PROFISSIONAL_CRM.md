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
- Tarefas ainda nao tem automacoes suficientes nem calendario/kanban.
- Relatorios ainda misturam muito indicador agregado e pouco funil acionavel.
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

2. Melhorar busca de catalogo.
   - Buscar por codigo, nome, medida, marca, grupo e tipo.
   - Separar produtos e servicos.
   - Mostrar preco vigente, desconto maximo, unidade e estoque quando existir.

3. Condicoes comerciais.
   - Multiplas condicoes: a vista, 30 dias, 30/60/90, cartao.
   - Prazo de entrega/execucao.
   - Observacoes e termos padrao.
   - Versoes da proposta.

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
   - Vencido vira tarefa urgente.
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

## Criterio de qualidade

Cada nova funcao so deve entrar como "pronta" se:

- usa dados reais do Supabase;
- nao depende de mock/fallback quando Supabase esta configurado;
- tem estado de carregamento claro;
- nao carrega a base inteira sem necessidade;
- registra auditoria/interacao quando muda status comercial;
- evita duplicidade em importacoes/campanhas/orcamentos;
- funciona para admin, gerente e vendedor respeitando permissao.
