# Queue CRM moderno 2026 - Capital Truck

Atualizado em: 2026-05-29

## Pesquisa usada

Fontes analisadas:
- Pipedrive CRM Features: https://www.pipedrive.com/en/crm/features
- Zoho Sales Force Automation: https://www.zoho.com/crm/sales-force-automation/
- Freshsales Features: https://www.freshworks.com/crm/features/
- monday CRM: https://www.monday.com/crm
- monday Sequences: https://support.monday.com/hc/en-us/articles/20666311273874-Sequences
- WhatsApp Best Practices for Marketing Messages: https://whatsappbusiness.com/wp-content/uploads/2026/04/Best-Practices-for-Marketing-Messages-on-WhatsApp-.pdf
- Salesforce CPQ guide: https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/Sales/find-the-right-cpq-solution.pdf

## Principios de produto

- O CRM deve dizer a proxima acao, nao apenas guardar dados.
- Toda campanha precisa virar fila operacional com tarefas, respostas, orcamentos e receita atribuida.
- Toda proposta deve nascer do catalogo real, respeitar preco vigente, desconto, aprovacao e versao.
- WhatsApp deve ser tratado como canal principal, mas com segmentacao, frequencia e qualidade de mensagem.
- Gerente precisa enxergar produtividade, atraso, conversao e forecast por vendedor.
- Vendedor precisa trabalhar em telas de rotina diaria, nao em relatorios soltos.

## P0 - Fundacao comercial imediata

### M01 - Cockpit diario do vendedor

Status: Concluido - primeira versao.

Objetivo:
Criar uma tela unica de execucao diaria com o que o vendedor precisa fazer hoje.

Entregas:
- Blocos: tarefas atrasadas, tarefas de hoje, respostas de campanha, orcamentos vencendo, Rodobens pendentes, oportunidades novas.
- Ordenacao por prioridade comercial.
- Acoes rapidas: abrir WhatsApp, criar orcamento, concluir tarefa, reagendar, abrir Ficha 360.
- Filtro automatico por vendedor logado.
- Visao gerente com seletor de vendedor.

Ja entregue:
- Tela `Cockpit` no menu principal e como destino inicial apos login.
- Blocos de respostas de campanha, tarefas criticas, propostas vencidas, Rodobens novos e oportunidades.
- Carregamento enxuto por queries paginadas, sem puxar base inteira.
- Concluir tarefa direto pelo cockpit.
- Abrir Ficha 360 ou iniciar orcamento a partir dos itens do cockpit.
- Visao admin com carga por vendedor.

Pronto quando:
- Um vendedor consegue trabalhar o dia inteiro por essa tela.
- Nenhuma acao importante exige entrar em tres modulos diferentes.

Proximas melhorias:
- Reagendamento de tarefa direto no cockpit.
- WhatsApp direto quando o bloco tiver telefone disponivel.
- Filtro gerente por vendedor.

Dependencias:
- Tarefas paginadas.
- Campanhas com status.
- Orcamentos paginados.

### M02 - SLA e fila de follow-up comercial

Status: Concluido - primeira versao.

Objetivo:
Transformar tarefas e campanhas em rotina com prazo, atraso e escalonamento.

Entregas:
- SLA por origem: campanha respondida, orcamento enviado, Rodobens novo, oportunidade alta prioridade.
- Indicador de atraso por vendedor.
- Tarefas geradas automaticamente quando campanha responde ou orcamento vence.
- Reagendamento com motivo.
- Alerta gerente para tarefas criticas atrasadas.

Ja entregue:
- Tarefas ganharam campos de ultimo reagendamento e motivo.
- Repository `rescheduleTarefa` atualiza vencimento, motivo e data do reagendamento.
- Cockpit permite reagendar tarefas criticas com motivo obrigatorio.
- Tela de Tarefas permite reagendar tarefas abertas inline.
- Ficha/lista de tarefas exibe o motivo do reagendamento quando existir.
- SLA visual por origem aparece no Cockpit e na tela de Tarefas: no prazo, no limite, vence hoje ou atrasada.
- Visao admin do Cockpit mostra tambem tarefas com SLA critico por vendedor.
- Criada view `vw_tarefas_sla_vendedor` para SLA global por vendedor, com atrasadas, vencem hoje, alta prioridade e origem critica.
- Cockpit admin passou a usar a visao global de SLA, nao apenas as tarefas carregadas na pagina.
- Cockpit admin ganhou painel `Alertas de SLA` com limite ajustavel de atraso/prioridade.
- Criada funcao Supabase `criar_tarefas_followup_automaticas` para abrir/atualizar tarefas deduplicadas de orcamentos vencidos e respostas de campanha.
- Pos-processamento da importacao diaria agora recalcula clientes, atualiza oportunidades e sincroniza follow-ups comerciais.
- Cockpit admin ganhou acao `Gerar follow-ups` para rodar a automacao sob demanda e recarregar a fila.

Proximas entregas:
- Evoluir para motor configuravel de automacoes no M11, incluindo log de regras executadas.

Pronto quando:
- O gerente sabe quem esta atrasado e em qual etapa.
- O vendedor recebe a proxima acao sem procurar manualmente.

### M03 - Pipeline comercial real

Status: Pendente.

Objetivo:
Separar oportunidade/deal de cliente, permitindo medir funil completo.

Entregas:
- Criar entidade `oportunidades` persistida, nao apenas cache.
- Estagios: novo lead, contato iniciado, qualificado, orcamento, negociacao, ganho, perdido.
- Origem: Rodobens, campanha, recompra, vendedor, importacao, manual.
- Valor estimado, probabilidade, previsao de fechamento e responsavel.
- Motivo de perda obrigatorio.
- Conversao por origem e vendedor.

Pronto quando:
- Cada venda potencial pode ser acompanhada ate ganhar ou perder.
- Campanha e Rodobens geram oportunidade real, nao apenas tarefa solta.

## P1 - Orcamento e CPQ

### M04 - Orcamento full-page profissional

Status: Parcial.

Objetivo:
Transformar o editor atual em pagina completa de proposta.

Entregas:
- Pagina propria por orcamento.
- Cabecalho com cliente, vendedor, origem, validade, forma de pagamento e status.
- Itens em tabela com busca no catalogo, quantidade, desconto, observacao e total.
- Multiplas condicoes comerciais na mesma proposta.
- Preview de WhatsApp e preview de proposta.
- Historico de versoes visivel na mesma pagina.

Ja entregue:
- Lista de orcamentos ganhou acao `Abrir proposta`.
- Criada tela `Proposta comercial` por orcamento, com resumo, itens, mensagem WhatsApp, condicoes comparativas, versoes e acoes de status.
- A tela permite aprovar/enviar, negociar, marcar ganho/perdido e revisar proposta com nova versao.
- Preview da proposta e mensagem WA.ME ficam na mesma area operacional.
- Criada tabela `orcamento_condicoes` no Supabase para gravar condicoes comerciais por proposta, com RLS alinhado a orcamentos.
- Criacao e revisao de proposta agora persistem condicoes como dados estruturados, nao apenas no texto do WhatsApp.

Pronto quando:
- Criar, revisar, enviar e aprovar uma proposta acontece em uma tela unica.

### M05 - Regras comerciais e guided selling

Status: Pendente.

Objetivo:
Ajudar o vendedor a montar proposta melhor usando historico e catalogo.

Entregas:
- Sugestao de recompra por produtos/medidas historicas.
- Sugestao de servicos complementares para pneus: montagem, balanceamento, alinhamento.
- Alerta de item sem preco vigente.
- Desconto maximo por item.
- Aprovacao obrigatoria acima do limite.
- Registro de margem/desconto aprovado por gerente.

Pronto quando:
- O sistema sugere o que vender e bloqueia proposta comercialmente insegura.

### M06 - Documento de proposta e envio

Status: Pendente.

Objetivo:
Gerar proposta pronta para cliente, sem retrabalho manual.

Entregas:
- Template HTML/PDF com logo, dados da empresa, cliente, itens, totais, validade e termos.
- Link ou arquivo baixavel.
- Mensagem WA.ME curta com resumo e chamada para resposta.
- Controle de enviado, visualizado manualmente e follow-up.
- Versionamento do documento enviado.

Pronto quando:
- A proposta pode ser enviada diretamente pelo sistema com padrao profissional.

## P2 - Campanhas e WhatsApp

### M07 - Segmentador avancado de campanhas

Status: Parcial.

Objetivo:
Permitir campanhas por filtros comerciais reais, nao apenas segmentos fixos.

Entregas:
- Filtros combinaveis: cidade, UF, origem, vendedor, vendedor historico, produto/servico comprado, medida, valor historico, ultima compra, ultimo contato, veiculo, KM, status de lead.
- Preview de publico antes de salvar.
- Contagem e amostra de clientes.
- Salvar segmento como lista reutilizavel.
- Criar campanha a partir do segmento.

Ja entregue:
- Tela de Campanhas permite combinar cidade, UF, vendedor, origem Capital/Rodobens/desconhecida, produto/servico comprado, dias sem compra, dias sem contato, valor historico minimo e somente clientes com WhatsApp.
- Os filtros avancados sao enviados para query paginada no Supabase e tambem funcionam no fallback local.
- Campanhas salvas preservam os filtros no `filtro_usado`, entao o publico pode ser reaberto depois.
- O segmentador agora cruza vendedor historico, status de lead, medida, placa/veiculo e faixa de KM usando vendas, servicos e veiculos importados.

Pronto quando:
- Gerente consegue montar campanha tipo: "clientes de Curitiba que compraram Michelin 295/80 e nao compram ha 120 dias".

### M08 - Regras de frequencia e opt-out de WhatsApp

Status: Parcial.

Objetivo:
Proteger reputacao e evitar excesso de mensagens.

Entregas:
- Janela minima entre campanhas por cliente.
- Status global `nao_contatar`.
- Motivo e data do opt-out.
- Bloqueio visual quando cliente foi acionado recentemente.
- Indicador de qualidade: sem WhatsApp, opt-out, contato recente, mensagem pendente.

Ja entregue:
- Campanhas agora calculam qualidade do publico por pagina: bloqueados, sem WhatsApp e opt-out.
- Envio e selecao em lote bloqueiam clientes sem WhatsApp, `Nao contatar` ou com contato recente.
- Proximo contato sugerido ignora clientes bloqueados por regra comercial.

Pronto quando:
- O sistema impede campanha indevida antes de abrir WhatsApp.

### M09 - Inbox de respostas de campanha

Status: Pendente.

Objetivo:
Criar fila especifica para respostas, separada da tela de montagem de campanha.

Entregas:
- Fila por status: respondeu, pediu preco, pediu retorno, virou orcamento, nao respondeu.
- Criar orcamento em 1 clique.
- Criar tarefa de retorno.
- Marcar ganho/perdido.
- Relatorio de resposta por vendedor e campanha.

Pronto quando:
- Toda resposta de campanha vira acao comercial rastreavel.

## P3 - Automacoes e sequencias

### M10 - Sequencias comerciais multietapa

Status: Pendente.

Objetivo:
Criar fluxos de contato com etapas manuais e automacoes.

Entregas:
- Sequencia: dia 0 WhatsApp, dia 2 follow-up, dia 7 nova tentativa, dia 15 encerrar ou criar tarefa gerente.
- Etapas podem esperar tarefa manual concluida antes de avancar.
- Pausar sequencia quando cliente responde ou vira orcamento.
- Aplicar sequencia a segmento, campanha ou lead Rodobens.

Pronto quando:
- A equipe consegue fazer cadencias consistentes sem lembrar manualmente cada passo.

### M11 - Motor de automacoes simples

Status: Pendente.

Objetivo:
Permitir regras internas sem reprogramar tudo.

Entregas:
- Regras tipo: quando status mudar para X, criar tarefa Y.
- Quando orcamento vencer, criar follow-up.
- Quando Rodobens virar qualificado, criar oportunidade.
- Quando campanha virar ganho, encerrar tarefas abertas da campanha.
- Log de automacao executada.

Pronto quando:
- Novos processos comerciais podem ser criados como regra configurada.

## P4 - Inteligencia e analytics

### M12 - Scoring comercial explicavel

Status: Pendente.

Objetivo:
Pontuar clientes e oportunidades com explicacao clara.

Entregas:
- Score por cliente: recencia, frequencia, valor, origem, WhatsApp, resposta, vendedor, produto comprado.
- Score por oportunidade.
- Motivos visiveis: "comprou alto valor", "sem contato 180 dias", "respondeu campanha".
- Filtro por score na carteira e campanhas.

Pronto quando:
- Vendedor entende por que aquele cliente esta no topo da fila.

### M13 - Forecast e metas

Status: Parcial.

Objetivo:
Dar previsao comercial por vendedor e periodo.

Entregas:
- Pipeline ponderado por probabilidade.
- Meta mensal por vendedor.
- Previsto vs realizado.
- Orcamentos vencendo/vencidos afetando forecast.
- Ranking de gargalos: sem follow-up, sem proposta, aguardando aprovacao.

Ja entregue:
- Criada view `vw_forecast_vendedor` com pipeline aberto, forecast ponderado, ganho do mes, propostas vencidas, propostas vencendo em 7 dias e gargalo principal.
- Tela de Relatorios ganhou painel `Forecast e gargalos` com resumo executivo e ranking por vendedor.

Pronto quando:
- Gerente consegue conduzir reuniao semanal pelo forecast do CRM.

### M14 - Relatorio de campanha por vendedor

Status: Pendente.

Objetivo:
Medir execucao e resultado de campanhas por responsavel.

Entregas:
- Enviados, respostas, tarefas abertas, orcamentos, ganhos, receita e ROI por vendedor.
- Comparativo por segmento.
- Filtro por periodo.
- Exportacao CSV.

Pronto quando:
- Fica claro qual campanha e qual vendedor geram receita.

## P5 - Operacao, dados e governanca

### M15 - Qualidade de dados acionavel

Status: Pendente.

Objetivo:
Transformar problemas de cadastro em fila de correcao.

Entregas:
- Filas: sem WhatsApp, telefone invalido, sem vendedor, cidade/UF ausente, possivel duplicado, cliente sem origem.
- Atribuir correcao para usuario.
- Marcar como resolvido.
- Medir qualidade por importacao.

Pronto quando:
- A base melhora toda semana, sem depender de auditoria manual em SQL.

### M16 - Importacao com reconciliacao visual

Status: Pendente.

Objetivo:
Mostrar ao admin o que mudou na importacao diaria antes/depois.

Entregas:
- Resumo de novos, atualizados, ignorados, conflitos.
- Mudancas de preco relevantes.
- Clientes que mudaram vendedor/status/origem.
- Vendas/servicos novos por data.
- Reprocessar pos-importacao com log.

Pronto quando:
- Importar arquivo diario vira rotina segura de poucos minutos.

### M17 - Permissoes e auditoria fina

Status: Pendente.

Objetivo:
Garantir seguranca operacional conforme o app cresce.

Entregas:
- Permissoes por modulo e acao.
- Auditoria de criacao/edicao/exclusao logica.
- Auditoria de aprovacao de desconto.
- Auditoria de campanha e opt-out.
- Relatorio de atividades por usuario.

Pronto quando:
- Alteracoes sensiveis sempre mostram quem fez, quando e por que.

## Ordem de execucao sugerida

1. M01 - Cockpit diario do vendedor.
2. M02 - SLA e fila de follow-up comercial.
3. M04 - Orcamento full-page profissional.
4. M05 - Regras comerciais e guided selling.
5. M07 - Segmentador avancado de campanhas.
6. M08 - Regras de frequencia e opt-out de WhatsApp.
7. M09 - Inbox de respostas de campanha.
8. M03 - Pipeline comercial real.
9. M10 - Sequencias comerciais multietapa.
10. M12 - Scoring comercial explicavel.
11. M13 - Forecast e metas.
12. M15 - Qualidade de dados acionavel.

## Primeira sprint recomendada

### Sprint S01 - Rotina comercial utilizavel

Objetivo:
Fazer vendedor e gerente usarem o CRM diariamente com menos friccao.

Escopo:
- M01 Cockpit diario.
- M02 SLA inicial para campanha, orcamento e Rodobens.
- M09 Inbox simples de respostas de campanha.

Resultado esperado:
- O CRM passa a abrir em uma tela de trabalho, nao em uma tela de indicadores.

### Sprint S02 - Proposta comercial forte

Objetivo:
Subir o nivel de orcamento para uma ferramenta de venda real.

Escopo:
- M04 Orcamento full-page.
- M05 Regras comerciais.
- M06 Documento de proposta.

Resultado esperado:
- O vendedor monta proposta melhor, com menos erro e mais velocidade.

### Sprint S03 - Campanha inteligente

Objetivo:
Transformar campanhas em motor recorrente de venda.

Escopo:
- M07 Segmentador avancado.
- M08 Frequencia/opt-out.
- M14 Relatorio por vendedor.

Resultado esperado:
- Campanhas deixam de ser lista de disparo e viram processo mensuravel de receita.
