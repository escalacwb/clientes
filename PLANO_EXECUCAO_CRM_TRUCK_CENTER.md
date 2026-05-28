# Plano de execucao - Central de Carteira Capital Truck

Data de inicio: 28/05/2026

## Estado atual

- App React/TypeScript criado em `app/`.
- MVP navegavel com dashboard, clientes, ficha do cliente, carteira, importacoes, campanhas e orcamentos.
- Dados mockados estruturados conforme o modelo de dominio.
- Registro local de interacao comercial na ficha do cliente.
- Criacao local de orcamento pela ficha do cliente, com registro automatico na timeline.
- Previa de XML diario na tela de importacoes, ainda sem gravacao no banco.
- Schema SQL inicial do Supabase criado em `app/supabase/schema.sql`.
- Schema SQL ja inclui triggers, score de oportunidade, view `fila_trabalho_clientes` e RLS inicial.
- Seed demonstrativo criado em `app/supabase/seed_demo.sql`.
- Repositories criados para clientes, interacoes, orcamentos e importacoes com fallback local.
- Repository de conflitos criado com fallback local.
- Tela de conflitos de importacao criada com acoes de resolucao.
- Tela de relatorios gerenciais criada.
- Campanhas agora geram mensagem `wa.me` por cliente e permitem status local de envio.
- Tela de usuarios e permissoes criada.
- Distribuicao local de clientes sem vendedor criada.
- Repository de usuarios criado com fallback local.
- Schema SQL recebeu trigger de auditoria automatica para campos sensiveis do cliente.
- Tela e repository de auditoria criados.
- Tela e repository de tarefas/proximas acoes criados.
- Registro de contato com data de retorno agora cria tarefa automaticamente.
- Repository de campanhas criado para persistir envios e criar campanha no Supabase quando necessario.
- Status de campanha agora cria interacao na timeline do cliente.
- Status `virou_orcamento` em campanha cria tarefa de follow-up.
- Tela de tarefas permite criacao manual e conclusao.
- Schema SQL atualiza datas do cliente apos interacao e audita conclusao de tarefa.
- Orcamentos agora aceitam itens com quantidade, valor unitario e total calculado.
- Tela de orcamentos permite marcar enviado, ganho ou perdido com motivo.
- Schema SQL audita mudanca de status de orcamento e cria interacao em ganho/perda.
- Ficha do cliente agora permite editar telefone, WhatsApp, responsavel, status e observacoes.
- Botao `Nao contatar` atualiza status e registra interacao.
- Repository de clientes atualiza dados comerciais e mapeia status para enum do Supabase.
- RLS permite vendedor atualizar clientes da propria carteira.
- Motor local de oportunidades automaticas criado.
- Tela de oportunidades criada com acao para gerar tarefa.
- Dashboard e relatorios exibem volume de oportunidades.
- View SQL `oportunidades_clientes` e repository de oportunidades criados.
- Tela de mesclagem de clientes criada.
- Repository de mesclagens criado.
- Funcao SQL `mesclar_clientes` criada para mover historico e excluir logicamente duplicado.
- Login local por perfil demonstrativo criado.
- Repository de auth criado para Supabase Auth.
- Menu e telas administrativas passam a respeitar perfil.
- Dados operacionais agora sao filtrados por carteira para vendedor.
- Preferencias locais salvam ultimo usuario e ultima tela.
- Comando `npm run check` criado para lint, build e dry-run da planilha.
- Tipos, mocks e repositories de vendas/servicos criados.
- Ficha do cliente exibe historico de vendas e servicos.
- Relatorios incluem ranking de medidas vendidas e servicos recorrentes.
- Views SQL `ranking_medidas_vendidas` e `ranking_servicos_recorrentes` criadas.
- Exportador JSON da planilha criado em `app/scripts/export-workbook-json.mjs`.
- Mapeadores da planilha centralizados em `app/scripts/workbook-mappers.mjs`.
- XML de exemplo criado em `app/examples/xml-venda-servico-exemplo.xml`.
- Script de analise da planilha inicial criado em `app/scripts/analyze-workbook.mjs`.
- Script de inspecao de XML criado em `app/scripts/inspect-xml.mjs`.

## Fase 1 - Base e importacao

Objetivo: transformar a planilha consolidada e os XMLs em uma base confiavel.

Entregaveis:

1. Criar projeto Supabase e executar `app/supabase/schema.sql`.
2. Configurar variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Criar importador da aba `Clientes consolidado`.
4. Criar importador da aba `Vendas por cliente`.
5. Criar importador da aba `Servicos por cliente`.
6. Implementar deduplicacao por `codigo_erp`, `cpf_cnpj`, telefone e nome+cidade.
7. Implementar tela de previa de importacao.
8. Persistir resultado da previa XML em `importacoes`.
9. Implementar tela de conflitos.

## Fase 2 - CRM do vendedor

Objetivo: fazer o vendedor trabalhar a carteira dentro do sistema.

Entregaveis:

1. Persistir interacoes no Supabase.
2. Persistir tarefas e proximas acoes.
3. Criar filtros reais de carteira.
4. Criar status comercial editavel.
5. Integrar botao `wa.me` com mensagem personalizada.
6. Criar modelos de mensagem.

## Fase 3 - Campanhas e orcamentos

Objetivo: transformar oportunidades em venda mensuravel.

Entregaveis:

1. Criar campanha com filtros salvos.
2. Gerar envios por cliente.
3. Registrar status de envio manual.
4. Persistir orcamento com itens.
5. Controlar ganho, perda e motivo de perda.
6. Relatorio de conversao por vendedor e campanha.

## Fase 4 - Inteligencia comercial

Objetivo: priorizar automaticamente quem deve ser trabalhado.

Entregaveis:

1. Calcular score no backend.
2. Criar oportunidades automaticas.
3. Gerar proxima melhor acao.
4. Criar ranking por cliente, cidade, medida e modelo.
5. Alertar clientes em risco.

## Comandos atuais

Dentro de `app/`:

```bash
npm run dev
npm run build
npm run lint
npm run analyze:workbook
npm run inspect:xml -- caminho/do/arquivo.xml
```

## Decisoes tomadas

- TypeScript no app inteiro.
- Supabase/PostgreSQL como backend alvo.
- Importacao pesada fica em scripts Node inicialmente.
- A interface prioriza fluxo operacional, nao landing page.
- A primeira versao usa dados locais para validar telas e regras antes da persistencia.

## Proxima execucao recomendada

1. Criar cliente Supabase no frontend.
2. Conectar tela de clientes ao `clientesRepository`.
3. Conectar resolucao de conflitos a auditoria e mesclagem real.
4. Converter `dry-run` da planilha em importacao com gravacao por lotes.
5. Transformar distribuicao local de carteira em fluxo com auditoria visivel.
6. Criar edicao completa de itens de orcamento apos aberto.
7. Persistir auditoria local/otimista com reload automatico do Supabase.
8. Trocar tela de oportunidades para usar repository quando Supabase estiver configurado.
9. Testar `mesclar_clientes` em projeto Supabase com seed antes de usar na base real.
10. Configurar usuarios reais no Supabase Auth e vincular `auth_user_id`.
