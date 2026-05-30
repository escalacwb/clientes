# Queue sprint profissional CRM 2026 - Capital Truck

Atualizado em: 2026-05-29

## Pesquisa recente

Fontes consultadas:
- Pipedrive CRM Features: https://www.pipedrive.com/en/crm/features
- Pipedrive Automations: https://support.pipedrive.com/hc/en-us/articles/360000943985
- Pipedrive data organization / Leads Inbox: https://support.pipedrive.com/en/article/how-is-pipedrive-data-organized
- HubSpot Quotes: https://www.hubspot.com/products/sales/quotes
- HubSpot Create and send quotes: https://knowledge.hubspot.com/quotes/create-and-send-quotes
- HubSpot product/service descriptions: https://legal.hubspot.com/services/hubspot-services-descriptions
- Zoho CRM Marketing Automation: https://www.zoho.com/en-uk/crm/lp/crm-automations.html
- Zoho Campaigns Workflow Automation: https://www.zoho.com/campaigns/help/handbook/workflow-automation-index.html
- Salesforce CPQ discounts: https://help.salesforce.com/s/articleView?id=sales.cpq_discounts.htm&language=en_US&type=5
- Salesforce CPQ map: https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/final_cpq_map.pdf

## Direcao de produto

- O app deve trabalhar como CRM operacional + CPQ + motor de campanhas para caminhoneiros/frotistas.
- Toda tela precisa responder: quem acionar, por que acionar, qual proposta montar e qual risco impedir.
- O diferencial sera usar historico real de vendas, servicos, placa, KM, vendedor historico, origem Capital/listas externas e listas de preco.
- Prioridade maxima: simplicidade de uso da equipe. Vendedor precisa registrar contato, abrir WhatsApp, criar proposta e follow-up sem sentir que esta preenchendo relatorio.
- Relatorios, auditoria e controles ficam como apoio gerencial discreto, sem atrapalhar a rotina comercial.

## Sprint A - CPQ profissional completo

Status: Em andamento.

Entregue nesta rodada:
- Proposta comercial full-page.
- Condicoes comerciais persistidas.
- Forecast ponderado por vendedor.
- Tabela `catalogo_regras_desconto` criada e integrada ao calculo de aprovacao de orcamentos por tipo/grupo/subgrupo/marca/codigo.
- Aprovacao gerencial ganhou parecer digitavel e historico de decisao no fluxo da proposta.
- Ficha do cliente simplificou o bloco `Atendimento agora`: resultado, observacao e proxima acao ficam em primeiro plano; IA e ajustes avancados ficam recolhidos.
- Navegacao principal ficou mais enxuta: tarefas, oportunidades, relatorios e auditoria deixam de competir com a rotina diaria no menu.
- Orcamento ganhou atalhos de pacotes complementares, sugerindo montagem, balanceamento, alinhamento e cambagem quando ha pneu na proposta.
- Botoes de resultado do atendimento agora preenchem proxima acao e data automaticamente para orcamento, sem resposta e comprar depois.
- Ficha do cliente prioriza abrir proposta em andamento antes de criar uma nova, reduzindo duplicidade e confusao no atendimento.
- Clientes sem cadastro ganharam acao unica `Abrir e registrar`, que abre WhatsApp, registra interacao, cria follow-up e muda status para contatado.
- Minha rotina ganhou bloco `Comece por aqui`, mostrando uma unica acao recomendada com botoes diretos para reduzir paralisia e abandono.
- Lista de clientes trocou score tecnico por prioridade comercial e mostra a proxima acao ja na linha do cliente.
- Ficha resumida do cliente removeu o orcamento antigo inline: agora o vendedor usa sempre o editor completo de proposta, com botao principal `Proposta` e acesso separado a `Ficha completa`.
- Registro rapido de contato na ficha ganhou resultados prontos, texto orientador e botao `Salvar contato e follow-up`, reduzindo duvida sobre o que sera gravado.
- Linguagem operacional foi padronizada para `Propostas` nos pontos visiveis do app, reduzindo a alternancia entre orcamento/proposta para o vendedor.
- Lista de propostas ficou menos poluida: exclusao foi movida para `Mais acoes` e perda fica recolhida em `Marcar perda`, mantendo foco em abrir, enviar, negociar e ganhar.
- Campanhas ficaram mais orientadas ao uso diario: etapas viraram `Publico`, `Texto`, `Enviar` e `Retornos`, e filtros avancados foram recolhidos para nao assustar o vendedor.
- Clientes sem cadastro virou uma fila mais operacional: acao principal `Abrir e registrar`, resultado em seletor unico e orientacao curta do fluxo de primeiro contato.
- Lista de clientes passou a mostrar `Proxima acao` como coluna principal, deixando vendedor como detalhe do local e tornando a fila mais acionavel.
- Proposta comercial ganhou termos padrao no WhatsApp e no PDF: disponibilidade antes da ordem de compra, prazo/agenda, validade das condicoes e garantia.
- Prazos de entrega e execucao ganharam atalhos rapidos no editor e na revisao da proposta, evitando digitacao repetitiva.
- Detalhe da proposta ganhou controle direto de follow-up com atalhos para hoje, 2 dias, 7 dias ou data manual, sem precisar revisar a proposta.
- PDF da proposta ficou mais compacto e tenta ajustar propostas medias em uma pagina, reduzindo quebras ruins e paginas finais quase vazias.
- Versao mobile ficou mais operacional: menu horizontal compacto, atalhos grandes, listas em cards e menos elementos de topo competindo com a acao principal.
- Segunda rodada mobile validada em sessao local: removido overflow horizontal, cards de clientes/propostas passaram a respeitar largura do celular, alerta administrativo foi ocultado no mobile e atalhos operacionais viraram barra inferior fixa.
- Terceira rodada mobile mudou a estrategia para uso real de vendedor: menu mobile mostra apenas Minha rotina, Clientes, Campanhas e Orcar; Importacoes/Equipe/Usuarios/Catalogo saem da navegacao mobile; a barra inferior prioriza Orcar, Campanhas, Clientes e Rotina; descricoes tecnicas e resumos gerenciais foram removidos da primeira leitura mobile.
- Propostas ganharam aceite manual de pedido: vendedor pode `Confirmar pedido`, registrar referencia/observacao, gravar usuario/data no Supabase e remover follow-up pendente do fluxo.

Proximos pontos:
- Continuar refinando proposta HTML imprimivel em casos extremos de muitos itens.
- Controle de envio: enviado em, enviado por, proximo follow-up e aceite manual cobertos; ainda evoluir revisao final do documento em casos extremos.

## Sprint B - Campanhas seguras e segmentacao forte

Status: Em andamento.

Entregue nesta rodada:
- Bloqueio visual de envio para sem WhatsApp, nao contatar e contato recente.
- Indicadores de bloqueados, sem WhatsApp e opt-out no painel de campanhas.
- Segmentacao combinavel em campanhas por cidade, UF, vendedor, origem Capital/listas externas, produto/servico comprado, dias sem compra, dias sem contato, valor historico minimo e somente com WhatsApp.
- Campanhas salvas preservam os filtros avancados no `filtro_usado`, permitindo reabrir o mesmo publico sem remontar manualmente.
- Segmentacao passou a cruzar vendedor historico, status de lead, medida, placa/veiculo e faixa de KM com vendas, servicos e cadastro de veiculos.
- Criada view `vw_clientes_campanha_elegibilidade` para centralizar bloqueios de campanha por nao contatar, falta de WhatsApp e contato recente.
- Campanhas agora salvam janela minima entre acionamentos, permitindo ajustar o bloqueio de contato recente por campanha.
- Opt-out de WhatsApp passou a registrar motivo, data e usuario no cliente.
- Criado `Inbox Campanhas` como fila dedicada de respostas/status para abrir ficha, criar tarefa, iniciar orcamento e marcar ganho/perda.
- Criado relatorio de campanha por vendedor com enviados, respostas, orcamentos, ganhos, tarefas abertas, receita e ROI.
- Inbox de campanhas foi simplificado para tres acoes por cliente: ficha, proposta/tarefa e seletor unico de resultado.
- Inbox de campanhas agora ordena retornos por prioridade e destaca `Comece por este retorno`, para reduzir escolha manual do vendedor.
- Campanhas no mobile ganharam bloco de envio rapido: escolher campanha salva, ver proximo cliente elegivel e abrir WhatsApp sem percorrer toda a tela.

Proximos pontos:
- Refinar campanhas com fila ainda mais guiada por prioridade e proximo retorno.

## Sprint C - Pipeline real e oportunidades persistidas

Status: Parcial.

Proximos pontos:
- Criar tela kanban/lista completa de oportunidades com gargalo por etapa.
- Sincronizar automaticamente orcamentos e campanhas com oportunidades reais.
- Exigir motivo de perda ao mover deal para perdido.
- Permitir editar valor estimado, probabilidade, previsao e responsavel.

Entregue nesta rodada:
- Tabela `oportunidades` real criada no Supabase.
- View `vw_oportunidades_pipeline` criada para forecast e acompanhamento.
- Motor de oportunidades passa a converter sugestao cacheada em deal persistido.
- Tela de oportunidades mostra pipeline aberto, valor em aberto, forecast e estagios.
- Kanban de oportunidades por etapa, edicao comercial do deal e motivo obrigatorio para perda.
- Sincronizacao automatica de orcamentos e campanhas com oportunidades reais.

## Sprint D - Automacoes e sequencias

Status: Parcial.

Proximos pontos:
- Criar sequencias adicionais alem da cadencia padrao, com segmentacao por origem/campanha.

Entregue nesta rodada:
- Tabelas de sequencias comerciais, etapas e execucoes.
- Sequencia padrao de WhatsApp manual 0/2/7/15.
- Acao em lote no motor de oportunidades para iniciar a cadencia.
- Pausa automatica de sequencias quando cliente responde, vira orcamento, ganha/perde ou recebe orcamento.
- Tabelas de regras/logs de automacao para rastreabilidade.
- Relatorios ganhou acao `Escalar sequencias`, que pausa cadencias estagnadas na ultima etapa e cria tarefas gerenciais deduplicadas.
- Relatorios ganhou painel de sequencias comerciais com ativas, pausadas, vencidas/hoje e fila por cliente.
- Relatorios permite ajustar dias, titulos e mensagens da cadencia padrao pelo app.

## Sprint E - Qualidade de dados e governanca

Status: Parcial.

Entregue nesta rodada:
- Fila acionavel de saneamento em Importacoes, com responsavel, abrir ficha e marcar resolvido.
- Fila de saneamento persiste responsavel e resolucao no Supabase em `importacao_saneamento_resolucoes`.
- Painel de saude da base com conflitos, sem vendedor, sem WhatsApp, origem desconhecida e fechamento pendente.
- Reconciliacao visual da ultima importacao com linhas, clientes, itens, ignorados/repetidos, conflitos e arquivos vinculados.
- Reconciliacao de importacao destaca mudancas recentes de preco por item, com valor anterior, novo, variacao e arquivo de origem.
- Auditoria ganhou cobertura operacional e resumo de eventos sensiveis.

Proximos pontos:
- Expandir auditoria fina para aprovacao, opt-out, campanha, proposta e mesclagem em uma trilha unificada.
- Reconciliação visual da importacao diaria: novos, alterados, ignorados, conflitos e precos alterados.

## Sprint F - Reuniao gerencial

Status: Parcial.

Entregue nesta rodada:
- View `vw_forecast_vendedor`.
- Painel `Forecast e gargalos`.
- Metas mensais por vendedor com receita, contatos, propostas, observacao, ranking e score comercial.
- Exportacao CSV da reuniao gerencial com metas, forecast, disciplina, follow-ups e gargalos por vendedor.
- Painel de alertas comerciais para propostas sem follow-up, propostas paradas e oportunidades sem tarefa.
- Indicador previsto vs realizado no painel de forecast.
- Alertas comerciais agora permitem criar tarefa e abrir proposta/ficha diretamente pelo painel gerencial.
- Alertas de proposta agora permitem marcar perda com motivo obrigatorio direto no painel gerencial.
- Forecast por origem da base e por produto/medida cotada no pipeline aberto.
- Exportacao PDF da reuniao semanal diretamente pelos Relatorios.

Proximos pontos:
- Revisar e limpar itens antigos da queue que ja foram entregues em sprints anteriores.

## Ordem de execucao continua

1. Fechar CPQ: regras, aprovacao e documento final.
2. Fechar campanhas: segmentacao persistida, opt-out e inbox.
3. Criar pipeline real.
4. Criar automacoes configuraveis e sequencias.
5. Criar qualidade de dados acionavel.
6. Fechar forecast/metas e reuniao gerencial.
7. Rodar auditoria local completa e abrir nova rodada de pesquisa.
