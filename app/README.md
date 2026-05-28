# Capital Truck CRM

MVP web da Central de Carteira Capital Truck, criado a partir da especificacao em `../ESPECIFICACAO_APP_CRM_TRUCK_CENTER.md`.

## Stack

- React
- TypeScript
- Vite
- Recharts
- Lucide React
- Supabase como backend alvo
- Node.js para scripts de importacao

## Rodar localmente

```bash
npm install
npm run dev
```

## Verificacoes

```bash
npm run lint
npm run build
npm run check
```

## Planilha inicial

Analisar abas e cabecalhos:

```bash
npm run analyze:workbook
```

Executar mapeamento em modo seguro, sem gravar no banco:

```bash
npm run dry-run:workbook -- --limit=100
```

Exportar JSON normalizado para revisao/carga em lote:

```bash
npm run export:workbook-json -- --out=exports/sample --limit=1000
```

## XML

Inspecionar a estrutura de um XML recebido:

```bash
npm run inspect:xml -- caminho/do/arquivo.xml
```

## Supabase

1. Crie um projeto Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Opcionalmente execute `supabase/seed_demo.sql` para dados de teste.
4. Copie `.env.example` para `.env.local`.
5. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
6. Crie usuarios no Supabase Auth e vincule `auth.users.id` em `public.users.auth_user_id`.

O app ainda usa mocks por padrao. A camada `src/repositories` foi criada para permitir trocar gradualmente os dados locais por consultas Supabase.

## Funcionalidades ja navegaveis

- Login local por perfil demonstrativo e preparo para Supabase Auth.
- Menu e dados operacionais filtrados por perfil/carteira.
- Ultimo usuario e ultima tela salvos localmente.
- Dashboard comercial com fila priorizada.
- Busca e listagem de clientes.
- Ficha viva do cliente com resumo inteligente.
- Historico de vendas e servicos na ficha do cliente.
- Edicao de telefone, WhatsApp, responsavel, status e observacoes na ficha.
- Botao nao contatar com registro no historico.
- Registro local de contato e timeline.
- Tarefas e proximas acoes com conclusao.
- Criacao manual de tarefas.
- Criacao local de orcamento pela ficha.
- Orcamentos com itens, quantidade e valor unitario.
- Atualizacao de status de orcamento e motivo de perda.
- Minha carteira com acoes rapidas.
- Oportunidades automaticas por regras de recompra, inatividade, orcamento, cadastro e venda cruzada.
- Previa de XML diario por upload, sem gravacao.
- Registro da previa XML no controle de importacoes.
- Campanhas WhatsApp com modelo de mensagem.
- Status local por envio de campanha: enviado, respondeu e virou orcamento.
- Repository de campanhas preparado para persistir envios no Supabase.
- Status de campanha tambem registra interacao na timeline.
- Conflitos de importacao com resolucao local.
- Mesclagem de clientes com escolha de principal e historico.
- Relatorios gerenciais de pipeline, conversao, carteira e importacoes.
- Rankings de medidas vendidas e servicos recorrentes.
- Usuarios e permissoes com visao por perfil.
- Distribuicao local de clientes sem vendedor.
- Auditoria de alteracoes sensiveis do cliente.

## Arquivos de exemplo

- `examples/xml-venda-servico-exemplo.xml`
