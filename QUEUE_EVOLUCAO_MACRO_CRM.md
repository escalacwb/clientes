# Queue macro de evolucao - Capital Truck CRM

Atualizado em: 2026-05-28

## Como usar

- Executar por blocos, nao por detalhes soltos.
- Cada item deve terminar com build passando e, quando envolver Supabase, SQL/repository validado.
- Ao concluir, marcar como `Concluido` e registrar commit/validacao no roadmap.
- Evitar aprofundar um modulo se houver outro bloco `P0` pendente.

## P0 - Fundacao e dados

### Q01 - Importacao diaria robusta no app

Status: Concluido.

Objetivo:
Transformar a importacao dos arquivos referencia em fluxo confiavel para uso diario, sem depender de IA ou script manual.

Entregas:
- Tela para pacote diario com arquivos obrigatorios e opcionais.
- Validacao de estrutura por tipo de arquivo.
- Deduplicacao idempotente para clientes, veiculos, ordens, vendas, servicos e precos.
- Resumo claro: novos, atualizados, ignorados, conflitos e erros.
- Logs por arquivo e por importacao.

Pronto quando:
- Reimportar o mesmo pacote nao duplica dados.
- Pacote menor do dia importa sem travar.
- Erros aparecem por arquivo/linha.

### Q02 - Fila inteligente no Supabase

Status: Em andamento.

Objetivo:
Tirar a fila inteligente do browser e gerar oportunidades/tarefas sugeridas pela base inteira.

Entregas:
- View/RPC para orcamentos vencidos/vencendo.
- View/RPC para Rodobens sem primeiro contato.
- View/RPC para clientes em risco sem compra.
- Repository paginado.
- Tela de tarefas usando dados globais, nao apenas clientes carregados.

Pronto quando:
- Admin ve a fila da base inteira.
- Vendedor ve apenas sua carteira.
- Criar tarefa a partir de sugestao evita duplicidade.

### Q03 - Orcamentos como funil real

Status: Concluido.

Objetivo:
Transformar orcamento em processo comercial controlado, da criacao ao ganho/perda.

Ja entregue:
- Editor dedicado de proposta.
- Itens com catalogo, quantidade, preco e desconto.
- Preview, mensagem WhatsApp e impressao.
- Aprovacao de desconto.
- Condicoes comparativas e follow-up automatico.
- Acao `Criar e enviar`, marcando status `enviado` quando nao exige aprovacao.
- Follow-up automatico especifico para proposta enviada.
- Rejeicao de aprovacao com motivo padronizado.
- Motivo de perda padronizado e obrigatorio.
- Contexto de origem preservado ao criar orcamento por campanha/tarefa.
- Campanha salva e marcada como `virou_orcamento` quando gera proposta.
- Snapshot inicial de versao da proposta com itens, total, condicao, origem e mensagem.
- Tela para consultar e comparar versoes anteriores da proposta.
- Revisao/edicao de proposta criando nova versao.
- Receita atribuida quando orcamento de campanha vira ganho.

Proximas entregas:
- Evolucoes futuras entram em Q08: ROI, custo de campanha e relatorio mais profundo.

Pronto quando:
- Gerente enxerga pipeline por status e vendedor.
- Campanha consegue atribuir receita de orcamento.
- Proposta pode ser revisada sem perder versoes anteriores.

### Q04 - Performance global por modulo

Status: Pendente.

Objetivo:
Eliminar carregamentos grandes no browser.

Ja entregue:
- Orcamentos paginados/filtrados no Supabase.
- Carga inicial de orcamentos limitada a contexto recente, sem puxar historico completo.
- Tarefas paginadas/filtradas no Supabase por status, origem e vendedor.
- Carga inicial de tarefas limitada a contexto recente.
- Campanhas com resumo por view agregada, sem nested payload de envios.
- Relatorios priorizam views agregadas; cargas auxiliares iniciais de interacoes/importacoes/conflitos foram limitadas.
- Estados de loading/vazio sem queda para cliente demonstrativo quando Supabase esta ativo.

Proximas entregas:
- Proximos refinamentos de performance entram nos blocos especificos de cada modulo.

Pronto quando:
- Entrar no app nao dispara carga completa de vendas/servicos/clientes.
- Cada tela carrega so o necessario para a visao atual.

## P1 - Comercial e rotina

### Q05 - Gestao de carteira por vendedor

Status: Pendente.

Objetivo:
Separar vendedor responsavel atual de vendedor historico e dar visao gerencial da carteira.

Ja entregue:
- Tela `Vendedores` separada de `Usuarios`.
- Filtros por vendedor responsavel, vendedor historico, cidade, origem e status.
- Clientes sem vendedor com sugestao de distribuicao.
- Carteira por vendedor com risco, tarefas, pipeline, contatos e cobertura.

Proximas entregas:
- Buscar clientes da tela `Vendedores` direto por query paginada, em vez da pagina atual carregada.
- Relatorio de vendedor historico vindo do ERP/importacao com campo dedicado.

Pronto quando:
- Gerente consegue redistribuir carteira com contexto.
- Vendedor historico nao se confunde com dono atual da carteira.

### Q06 - Ficha 360 realmente acionavel

Status: Parcial.

Objetivo:
Fazer a ficha do cliente virar a central viva do relacionamento.

Ja entregue:
- Pagina dedicada com vendas, servicos, orcamentos e filtros basicos.

Proximas entregas:
- Aba de veiculos com placa, KM e historico.
- Aba de campanhas do cliente.
- Aba de tarefas/atividades.
- Acoes contextuais: repetir compra, criar orcamento de item anterior, criar tarefa, criar campanha.
- Resumo executivo: ticket medio, frequencia, produto principal, servico recorrente, proxima recompra.

Pronto quando:
- Um vendedor abre um cliente e entende em 30 segundos o que vender e qual proxima acao.

### Q07 - Inbox Rodobens como qualificacao de lead

Status: Parcial.

Objetivo:
Separar leads Rodobens de clientes ativos Capital e controlar primeiro contato.

Ja entregue:
- Tela Inbox Rodobens.
- Filtro de origem.
- Acoes de contato e tarefa.

Proximas entregas:
- Status de qualificacao: novo, contatado, qualificado, virou cliente, descartado, nao contatar.
- Metricas de conversao Rodobens.
- Converter lead para carteira Capital.
- Origem Rodobens confiavel via importacao, nao por inferencia fraca.

Pronto quando:
- Gerente sabe quantos Rodobens foram contatados e quantos viraram oportunidade/venda.

### Q08 - Campanhas com receita atribuida

Status: Parcial.

Objetivo:
Medir campanha ate venda, nao apenas envio/resposta.

Ja entregue:
- Segmentos e filtros.
- Campanhas salvas.
- Fila WhatsApp.
- Status finais e relatorio basico.

Proximas entregas:
- Seletor assistido de produtos/servicos do catalogo.
- Vinculo campanha -> orcamento -> ganho/perda.
- Receita atribuida.
- Janela minima entre campanhas por cliente.
- Campo de objetivo, custo e ROI.

Pronto quando:
- Uma campanha mostra alcance, respostas, orcamentos, ganhos, receita e ROI.

## P2 - Produto, preco e proposta

### Q09 - Catalogo profissional

Status: Pendente.

Objetivo:
Gerir produtos, servicos, precos, vigencia e regras comerciais.

Entregas:
- Tela de catalogo com produtos e servicos.
- Busca por codigo, medida, marca, grupo, tipo e status.
- Vigencia de preco.
- Desconto maximo por item.
- Produtos/servicos inativos.
- Sugestoes complementares.

Pronto quando:
- Orcamento usa catalogo confiavel e regras comerciais reais.

### Q10 - Importacao de precos e produtos

Status: Parcial.

Objetivo:
Atualizar catalogo e precos sem duplicar e com historico.

Entregas:
- Importar `precoprodutos` e `precosservicos` incrementalmente.
- Criar vigencia quando preco mudar.
- Resumo de alteracoes de preco.
- Guardar preco anterior.
- Validar desconto maximo quando existir.

Pronto quando:
- Enviar uma tabela nova atualiza apenas o que mudou.

### Q11 - Proposta comercial profissional

Status: Parcial.

Objetivo:
Gerar proposta que possa ser enviada como PDF/WhatsApp com padrao comercial.

Entregas:
- Template com logo/dados comerciais.
- Termos padrao.
- Validade e condicoes por prazo.
- Versoes.
- PDF mais controlado que print do navegador.

Pronto quando:
- A proposta pode ser enviada ao cliente sem retrabalho manual.

## P3 - Gestao e relatorios

### Q12 - Relatorios gerenciais de funil

Status: Pendente.

Objetivo:
Mostrar o fluxo comercial completo por vendedor, origem e periodo.

Entregas:
- Leads/contatos/orcamentos/ganhos/perdidos.
- Motivos de perda.
- Tempo medio ate fechamento.
- Pipeline aberto por vendedor.
- Atividades feitas no dia.

Pronto quando:
- Gerente consegue conduzir reuniao diaria olhando o sistema.

### Q13 - Dashboard de importacao e qualidade de dados

Status: Pendente.

Objetivo:
Controlar saude da base e importacoes.

Entregas:
- Ultima importacao por tipo.
- Linhas novas/atualizadas/ignoradas.
- Conflitos pendentes.
- Clientes sem WhatsApp, sem vendedor, sem origem, possiveis duplicados.
- Alertas de arquivos obrigatorios ausentes.

Pronto quando:
- Qualquer problema de arquivo/base fica visivel sem abrir SQL.

### Q14 - Auditoria e seguranca operacional

Status: Parcial.

Objetivo:
Garantir rastreabilidade das mudancas importantes.

Entregas:
- Auditoria de status de cliente, orcamento, campanha e tarefa.
- Historico de aprovacao/rejeicao.
- Permissoes revisadas por perfil.
- Evitar service role no frontend.

Pronto quando:
- Mudancas sensiveis mostram quem fez, quando e por que.

## Ordem sugerida imediata

1. Q03 - Orcamentos como funil real.
2. Q02 - Fila inteligente no Supabase.
3. Q01 - Importacao diaria robusta no app.
4. Q06 - Ficha 360 realmente acionavel.
5. Q05 - Gestao de carteira por vendedor.
6. Q08 - Campanhas com receita atribuida.
7. Q09 - Catalogo profissional.
8. Q12 - Relatorios gerenciais de funil.

## Itens concluidos recentemente

- Clientes paginados no Supabase.
- Dashboard e relatorios com views agregadas iniciais.
- Inbox Rodobens inicial.
- Editor dedicado de orcamento.
- Preview de proposta.
- Aprovacao de desconto.
- Campanhas com filtros, campanhas salvas e relatorio.
- Fechamento comercial de campanhas.
- Fila inteligente inicial em tarefas.
- Orcamento com condicoes comparativas e follow-up.
