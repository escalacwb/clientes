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
- O diferencial sera usar historico real de vendas, servicos, placa, KM, vendedor historico, origem Capital/Rodobens e listas de preco.
- Nao basta cadastrar: cada registro precisa gerar fila, forecast, auditoria ou proxima acao.

## Sprint A - CPQ profissional completo

Status: Em andamento.

Entregue nesta rodada:
- Proposta comercial full-page.
- Condicoes comerciais persistidas.
- Forecast ponderado por vendedor.
- Tabela `catalogo_regras_desconto` criada e integrada ao calculo de aprovacao de orcamentos por tipo/grupo/subgrupo/marca/codigo.
- Aprovacao gerencial ganhou parecer digitavel e historico de decisao no fluxo da proposta.

Proximos pontos:
- Bundles sugeridos: pneu + montagem + balanceamento + alinhamento.
- Proposta HTML imprimivel com layout final e termos padrao.
- Campo de prazo de entrega/execucao por item ou proposta.
- Controle de envio: enviado em, enviado por, proximo follow-up, status de aceite manual. Parcial: acao `Registrar envio e abrir WA.ME` grava envio e follow-up antes de abrir WhatsApp.

## Sprint B - Campanhas seguras e segmentacao forte

Status: Em andamento.

Entregue nesta rodada:
- Bloqueio visual de envio para sem WhatsApp, nao contatar e contato recente.
- Indicadores de bloqueados, sem WhatsApp e opt-out no painel de campanhas.
- Segmentacao combinavel em campanhas por cidade, UF, vendedor, origem Capital/Rodobens, produto/servico comprado, dias sem compra, dias sem contato, valor historico minimo e somente com WhatsApp.
- Campanhas salvas preservam os filtros avancados no `filtro_usado`, permitindo reabrir o mesmo publico sem remontar manualmente.
- Segmentacao passou a cruzar vendedor historico, status de lead, medida, placa/veiculo e faixa de KM com vendas, servicos e cadastro de veiculos.
- Criada view `vw_clientes_campanha_elegibilidade` para centralizar bloqueios de campanha por nao contatar, falta de WhatsApp e contato recente.
- Campanhas agora salvam janela minima entre acionamentos, permitindo ajustar o bloqueio de contato recente por campanha.
- Opt-out de WhatsApp passou a registrar motivo, data e usuario no cliente.
- Criado `Inbox Campanhas` como fila dedicada de respostas/status para abrir ficha, criar tarefa, iniciar orcamento e marcar ganho/perda.
- Criado relatorio de campanha por vendedor com enviados, respostas, orcamentos, ganhos, tarefas abertas, receita e ROI.

Proximos pontos:
- Avancar CPQ: regras de desconto, aprovacao formal, bundles e documento final.

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
- Tabela de regras de automacao.
- Log de automacao executada.
- Pausar sequencia quando cliente responde, vira orcamento ou marca nao contatar.
- Criar tarefa gerente quando sequencia estagnar.

Entregue nesta rodada:
- Tabelas de sequencias comerciais, etapas e execucoes.
- Sequencia padrao de WhatsApp manual 0/2/7/15.
- Acao em lote no motor de oportunidades para iniciar a cadencia.
- Pausa automatica de sequencias quando cliente responde, vira orcamento, ganha/perde ou recebe orcamento.
- Tabelas de regras/logs de automacao para rastreabilidade.

## Sprint E - Qualidade de dados e governanca

Status: Parcial.

Entregue nesta rodada:
- Fila acionavel de saneamento em Importacoes, com responsavel, abrir ficha e marcar resolvido.
- Painel de saude da base com conflitos, sem vendedor, sem WhatsApp, origem desconhecida e fechamento pendente.
- Reconciliacao visual da ultima importacao com linhas, clientes, itens, ignorados/repetidos, conflitos e arquivos vinculados.
- Auditoria ganhou cobertura operacional e resumo de eventos sensiveis.

Proximos pontos:
- Persistir responsavel/resolucao da fila de saneamento no Supabase, nao apenas na sessao da tela.
- Expandir auditoria fina para aprovacao, opt-out, campanha, proposta e mesclagem em uma trilha unificada.
- Destacar mudancas relevantes de preco entre importacoes de catalogo.
- Reconciliação visual da importacao diaria: novos, alterados, ignorados, conflitos e precos alterados.

## Sprint F - Reuniao gerencial

Status: Parcial.

Entregue nesta rodada:
- View `vw_forecast_vendedor`.
- Painel `Forecast e gargalos`.

Proximos pontos:
- Metas mensais por vendedor.
- Previsto vs realizado.
- Forecast por origem e por produto/medida.
- Alertas: proposta sem follow-up, proposta parada 7 dias, alta probabilidade sem proxima tarefa.
- Exportacao CSV/PDF da reuniao semanal.

## Ordem de execucao continua

1. Fechar CPQ: regras, aprovacao e documento final.
2. Fechar campanhas: segmentacao persistida, opt-out e inbox.
3. Criar pipeline real.
4. Criar automacoes configuraveis e sequencias.
5. Criar qualidade de dados acionavel.
6. Fechar forecast/metas e reuniao gerencial.
7. Rodar auditoria local completa e abrir nova rodada de pesquisa.
