# Roadmap profissional - Capital Truck CRM

Atualizado em: 2026-05-28

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

## Criterio de qualidade

Cada nova funcao so deve entrar como "pronta" se:

- usa dados reais do Supabase;
- nao depende de mock/fallback quando Supabase esta configurado;
- tem estado de carregamento claro;
- nao carrega a base inteira sem necessidade;
- registra auditoria/interacao quando muda status comercial;
- evita duplicidade em importacoes/campanhas/orcamentos;
- funciona para admin, gerente e vendedor respeitando permissao.
