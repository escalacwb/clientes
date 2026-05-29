# Auditoria local e roadmap de ferramentas - 2026-05-28

## Metodo

- App testado localmente em `http://127.0.0.1:5173`.
- Login Supabase validado com Wagner Fonseca admin.
- Navegacao cobriu: Dashboard, Clientes, Inbox Rodobens, Minha carteira, Oportunidades, Tarefas, Importacoes, Conflitos, Mesclagem, Campanhas, Orcamentos, Catalogo, Relatorios, Vendedores, Usuarios e Auditoria.
- Screenshots e relatorio Playwright gerados em `app/local-audit-*.png` e `app/local-audit-report-2.json`.
- Pesquisa externa consultou Salesforce Automotive Cloud, Zoho Automotive CRM, Zoho CPQ, YardCRM e ferramenta de inventario para pneus.

## Achados criticos do teste local

### A1 - Orcamentos quebravam por relacionamento ambiguo

Status: corrigido.

Sintoma:
- Tela de Orcamentos exibia `Nao foi possivel carregar os orcamentos`.
- O erro ficava no banner global e contaminava outras telas.

Causa:
- Select Supabase usava `users(nome)` em `orcamentos`.
- A tabela tem duas FKs para `users`: vendedor e aprovador.

Correcao aplicada:
- Repository passou a usar `users!orcamentos_vendedor_id_fkey(nome)`.
- Build passou e consulta autenticada retornou sem erro.

### A2 - Banner global de erro fica preso

Status: pendente.

Impacto:
- Mesmo depois de trocar de tela, uma falha antiga continua aparecendo.

Acao recomendada:
- Transformar `dataError` em erro por modulo ou limpar erro na troca de `view`.
- Cada tela deve ter seu estado local de falha, sem poluir o app inteiro.

### A3 - Algumas metricas usam pagina atual, nao base inteira

Status: pendente.

Exemplos:
- Usuarios mostrou carteira com contagens inconsistentes com a base real.
- Dashboard ainda mistura alguns indicadores globais com dados da pagina inicial de clientes.

Acao recomendada:
- Criar views agregadas por usuario/perfil e substituir calculos derivados de `clientes` paginado.

### A4 - Oportunidades pode demorar e aparentar travamento

Status: pendente.

Sintoma:
- Tela mostrou `Carregando oportunidades...` mesmo com a view tendo dezenas de milhares de registros.

Acao recomendada:
- Garantir resposta paginada com filtro padrao limitado.
- Adicionar cards de contagem por tipo e skeleton por no maximo alguns segundos.

### A5 - William entra mas nao ve carteira

Status: dado/operacao.

Validacao:
- Login de William funciona.
- Consulta autenticada retornou 0 clientes visiveis para ele.

Acao recomendada:
- Redistribuir carteira ou criar fila inicial de clientes para William.

## Ferramentas que precisam evoluir ou ser implementadas

### P0 - Base operacional confiavel

1. Central de erros por modulo
- Erro local por tela.
- Retry por modulo.
- Log tecnico acessivel ao admin.

2. Views gerenciais para todas as metricas
- Carteira por usuario real.
- Usuarios com clientes, pipeline, tarefas, contatos e risco.
- Dashboard sem depender da pagina atual de clientes.

3. Monitor de importacao profissional
- Tendencia de precos alterados por importacao.
- Possiveis duplicados dentro do painel de saude.
- Auditoria por arquivo: linhas novas, atualizadas, ignoradas e erro por tipo.

### P1 - Comercial diario

4. Workbench de oportunidades
- Filtros por tipo: recompra, Rodobens, sem vendedor, alto valor, sem WhatsApp, orcamento vencido.
- Atribuicao em lote para vendedor.
- Converter oportunidade em tarefa, campanha ou orcamento.

5. Agenda/rotina do vendedor
- Visao Hoje, Atrasadas, Proximos 7 dias.
- Criacao rapida de contato.
- Conclusao com resultado padronizado.

6. Carteira de vendedor com meta e cobertura
- Quantos clientes sob responsabilidade.
- Cobertura de contato 30/60 dias.
- Clientes sem compra por faixa.
- Pipeline aberto e propostas vencidas.

### P2 - CPQ e proposta

7. CPQ de pneus e servicos
- Regras de kits: pneu + montagem + balanceamento + alinhamento.
- Desconto por item, por condicao e por quantidade.
- Bloqueio ou aprovacao por margem/desconto.
- Itens opcionais no orcamento.

8. Proposta profissional
- Template HTML/PDF controlado.
- Logo, dados comerciais, termos, validade e condicoes.
- Versoes comparaveis.
- Link publico ou PDF compartilhavel.

9. Estoque e disponibilidade
- Preco por lista.
- Estoque por item.
- Itens indisponiveis ou inativos.
- Alerta de preco vencido ou sem vigencia.

### P3 - Campanhas e relacionamento

10. Campanhas por produto/interesse
- Segmentos por produto comprado, medida, marca, servico, cidade, vendedor, origem e inatividade.
- Janela minima entre campanhas por cliente.
- Supressao/nao contatar.
- Fila de WhatsApp com status e proximo contato.

11. Jornada Rodobens
- Conversao por status, vendedor e periodo.
- SLA de primeiro contato.
- Motivos de descarte.
- Conversao para carteira Capital com tarefa automatica.

12. Recompra preditiva
- Proxima compra estimada por produto/servico.
- Oportunidades por ciclo de uso.
- Sugestao de mensagem e itens para orcamento.

### P4 - Atendimento, veiculos e servicos

13. Agenda de servicos
- Agendamento por veiculo/placa.
- Servicos recorrentes.
- Status de atendimento.
- Historico por placa e KM.

14. Veiculo 360
- Timeline por placa.
- KM mais recente.
- Pneus/servicos realizados.
- Sugestao de manutencao.

### P5 - Direcao e governanca

15. Relatorios executivos
- Funil por periodo.
- Ranking de vendedores.
- ROI de campanhas.
- Motivos de perda.
- Receita por origem e por produto.

16. Permissoes e auditoria
- Matriz clara admin/gerente/vendedor.
- Auditoria de alteracoes sensiveis.
- Exportacao de log.

## Referencias externas usadas

- Salesforce Automotive Cloud: customer/vehicle touchpoints, alerts, recommendations, AI/automation e campanhas no ciclo de vida.
- Zoho Automotive CRM: e-catalog, cross-sell, previsao de recompra e foco em deals.
- Zoho CPQ: automacao de linhas, produtos complementares, descontos e dashboards de quotes.
- YardCRM: inventario, CRM, follow-up, buyer history, branded PDFs e campanhas com queue/supressao.
- TireInventorySoftware: cotacao ligada a estoque, fornecedor, preco por local e pedidos sem redigitacao.

## Proxima ordem sugerida

1. Corrigir erro global por modulo e metricas baseadas em pagina atual.
2. Criar views agregadas para Usuarios/Vendedores e Dashboard.
3. Evoluir CPQ com kits de pneu + servicos e itens opcionais.
4. Criar campanhas por produto/medida/marca usando catalogo e historico.
5. Criar agenda de servicos e Veiculo 360.
