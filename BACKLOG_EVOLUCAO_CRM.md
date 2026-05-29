# Backlog de evolucao do Capital Truck CRM

> Roadmap profissional atualizado: `ROADMAP_IMPLEMENTACOES_PROFISSIONAL_CRM.md`.
> Queue macro de execucao: `QUEUE_EVOLUCAO_MACRO_CRM.md`.
> Este arquivo fica como backlog historico; a sequencia atual de produto deve seguir o roadmap novo.

## Diagnostico atual

- A base importada atual tem 21.575 clientes no Supabase, 10.541 veiculos, 32.958 ordens, 7.257 itens de vendas, 53.796 itens de servicos e 74 itens no catalogo importado.
- As tabelas `campanhas` e `campanha_envios` estao vazias.
- A tela historico carrega apenas 1.000 vendas e 1.000 servicos por causa de `limit(1000)` no frontend.
- O campo atual `clientes.origem` nao separa claramente Capital Truck Center x Rodobens. Hoje ele guarda valores como `Adicionado por serviços`, `Adicionado do arquivo.xls` e `Já existia no sell-out`.
- Em servicos, existe uma pista pelo campo `servicos_itens.unidade`, com valores `Capital Service-DOURADOS` e `CAPITAL TRUCK CENTER-DOURADOS`.
- Em vendas, o campo `vendas_itens.unidade` esta vazio na importacao atual.
- O vendedor da venda existe em `vendas_itens.vendedor_nome`, mas ainda nao ha filtros e paineis profissionais para explorar isso.

## Objetivo do produto

Construir um CRM operacional para venda e pos-venda de pneus/servicos, com:

- carteira por vendedor;
- separacao de clientes ativos Capital Truck x leads/origem Rodobens;
- ficha 360 do cliente;
- historico completo de compras e servicos;
- orcamento com catalogo, tabela de preco e envio por WhatsApp;
- importacoes incrementais sem duplicar dados;
- campanhas praticas de reativacao, recompra e primeiro contato;
- dashboards de gestao e produtividade.

## Referencias de mercado consideradas

- HubSpot e Pipedrive: contato, atividades, tarefas, pipeline, automacoes e conversas integradas.
- Zoho CRM/Inventory: produtos, price books, quotes, sales orders, invoices e WhatsApp.
- CPQ: fluxo Configure, Price, Quote para montar orcamentos com regras de preco, catalogo e aprovacao.
- WATI/WhatsApp CRMs: caixa compartilhada, campanhas, templates, automacoes e historico por cliente.

## Fase 1 - Corrigir fundacao de dados

1. Criar classificacao de origem comercial do cliente.
   - Adicionar em `clientes`: `origem_base` com valores como `capital_truck`, `rodobens`, `desconhecida`.
   - Adicionar em `clientes`: `origem_detalhe` para guardar texto original da planilha.
   - Adicionar em vendas/servicos, se necessario: `empresa_origem`, `unidade_origem`.
   - Criar filtros: Todos, Capital Truck, Rodobens, Desconhecida.

2. Normalizar a base atual.
   - Rodar SQL de classificacao inicial usando colunas existentes.
   - Identificar quantos clientes ficaram sem classificacao.
   - Solicitar um arquivo de exemplo caso Rodobens nao esteja recuperavel na importacao atual.

3. Remover limite artificial de 1.000 itens.
   - Implementar paginacao/range no repository.
   - Para telas gerais, carregar agregados do banco.
   - Para ficha do cliente, carregar historico completo daquele cliente sob demanda.

4. Criar chaves anti-duplicacao por importacao.
   - Clientes: `codigo_erp`, `cpf_cnpj`, ou chave normalizada por nome + cidade + telefone quando faltar codigo.
   - Vendas: manter/aperfeicoar `chave_unica`.
   - Servicos: manter/aperfeicoar `chave_unica`.
   - Produtos: `codigo_produto` + fabricante/linha quando necessario.
   - Tabela de preco: `produto_id` + `lista_preco_id` + vigencia.

## Fase 2 - Ficha 360 do cliente

1. Criar pagina completa do cliente.
   - Dados cadastrais.
   - Origem: Capital Truck/Rodobens/desconhecida.
   - Responsavel, telefone, WhatsApp, email.
   - Vendedor responsavel atual.
   - Vendedores que ja venderam para o cliente.
   - Ultimas compras.
   - Todos os produtos comprados.
   - Todos os servicos realizados.
   - Orcamentos.
   - Interacoes.
   - Tarefas.
   - Campanhas.
   - Observacoes e tags.

2. Criar filtros internos da ficha.
   - Por periodo.
   - Por vendedor da venda.
   - Por produto/servico.
   - Por placa, quando existir.
   - Por origem/unidade.

3. Criar resumo executivo.
   - Total comprado.
   - Total em servicos.
   - Ticket medio.
   - Recencia.
   - Frequencia.
   - Produtos principais.
   - Proxima melhor acao.

## Fase 3 - Visao por vendedor

1. Criar tela "Vendedores".
   - Ranking por faturamento.
   - Quantidade de clientes atendidos.
   - Clientes ativos na carteira.
   - Clientes vendidos por vendedor historico.
   - Clientes sem vendedor atual, mas com venda historica.
   - Clientes Rodobens para primeiro contato.

2. Criar filtros globais.
   - Vendedor atual da carteira.
   - Vendedor da venda historica.
   - Origem Capital Truck/Rodobens.
   - Cidade/UF.
   - Periodo da venda.
   - Status comercial.
   - Sem contato, sem WhatsApp, sem vendedor.

3. Diferenciar dois conceitos.
   - `vendedor_responsavel`: dono atual da carteira.
   - `vendedor_historico`: vendedor que fez determinada venda/servico no ERP.

## Fase 4 - Importacoes diarias incrementais

1. Criar central de importacao por tipo.
   - Clientes/cadastro.
   - Vendas do dia ou historico.
   - Servicos do dia ou historico.
   - Produtos.
   - Tabela de preco.
   - XML/NF-e quando fizer sentido.

2. Criar preview antes de importar.
   - Linhas novas.
   - Linhas atualizadas.
   - Linhas ignoradas por duplicidade.
   - Conflitos.
   - Campos ausentes.

3. Garantir importacao idempotente.
   - Se enviar historico inteiro novamente, importar apenas o que mudou.
   - Se enviar vendas do dia, inserir apenas vendas novas.
   - Se cliente ja existe, atualizar apenas campos permitidos.
   - Registrar log em `importacoes`.

4. Criar arquivos-modelo.
   - Template de clientes.
   - Template de vendas.
   - Template de servicos.
   - Template de produtos.
   - Template de tabela de preco.

## Fase 5 - Produtos, preco e orcamentos

1. Criar tabelas de produto.
   - `produtos`
   - `produto_precos`
   - `listas_preco`
   - `produto_estoque`, se houver estoque no arquivo
   - `produto_aliases`, para mapear nomes/codigos diferentes

2. Criar importador de produtos e tabela de preco.
   - Ler XML, XLSX ou CSV.
   - Atualizar produto existente pelo codigo.
   - Criar novo produto se codigo nao existir.
   - Guardar vigencia da tabela de preco.
   - Nao duplicar precos iguais.

3. Evoluir orcamentos.
   - Buscar cliente.
   - Buscar produto por codigo, medida, marca ou nome.
   - Inserir itens.
   - Calcular quantidade, desconto, valor unitario e total.
   - Usar tabela de preco vigente.
   - Gerar mensagem de WhatsApp.
   - Gerar PDF.
   - Status: rascunho, enviado, aprovado, perdido, expirado.

4. Criar envio pelo WhatsApp.
   - Link `wa.me` no primeiro momento.
   - Depois integrar WhatsApp Business API se quiser envio e historico automatizado.

## Fase 6 - Campanhas profissionais

1. Criar campanhas como entidade real.
   - Nome.
   - Objetivo.
   - Publico-alvo.
   - Filtros.
   - Template da mensagem.
   - Responsavel.
   - Status.

2. Criar tipos de campanha.
   - Primeiro contato Rodobens.
   - Reativacao sem compra ha X dias.
   - Recompra por tipo de pneu/produto.
   - Pos-servico.
   - Orcamento sem resposta.

3. Criar funil de campanha.
   - Pendente.
   - Enviado.
   - Respondeu.
   - Virou orcamento.
   - Ganhou.
   - Perdido.
   - Nao contatar.

4. Evitar disparo duplicado.
   - Um cliente nao deve entrar duas vezes na mesma campanha.
   - Respeitar janela minima de contato.
   - Respeitar status `nao_contatar`.

## Fase 7 - Dashboards gerenciais

1. Dashboard comercial.
   - Receita por periodo.
   - Receita por vendedor historico.
   - Receita por vendedor responsavel.
   - Receita por origem Capital/Rodobens.
   - Clientes novos.
   - Clientes reativados.

2. Dashboard de carteira.
   - Clientes sem contato.
   - Clientes em risco.
   - Rodobens sem primeiro contato.
   - Clientes sem vendedor.
   - Tarefas vencidas.

3. Dashboard de importacao.
   - Ultima importacao.
   - Linhas novas/ignoradas/atualizadas.
   - Conflitos pendentes.
   - Qualidade de dados.

## Dados que preciso receber como padrao

1. Arquivo de clientes/cadastro.
   - Uma amostra real com cabecalho.
   - Indicar qual coluna diferencia Capital Truck x Rodobens.

2. Arquivo de vendas diaria/historica.
   - Uma amostra real com cabecalho.
   - Indicar campos que tornam uma venda unica: nota, serie, pedido, item, data, codigo cliente, codigo produto.

3. Arquivo de produtos.
   - Codigo.
   - Nome/descricao.
   - Marca.
   - Modelo.
   - Medida.
   - Categoria.
   - Ativo/inativo.

4. Tabela de preco.
   - Codigo do produto.
   - Lista/tipo de preco.
   - Valor.
   - Vigencia.
   - Desconto maximo, se existir.

5. XML.
   - Enviar alguns exemplos reais para mapear campos.

## Ordem recomendada de execucao

1. Corrigir origem Capital/Rodobens.
2. Remover limite de 1.000 e criar ficha 360 do cliente.
3. Criar filtros por vendedor historico e vendedor responsavel.
4. Criar importacao incremental robusta para clientes/vendas/servicos.
5. Criar produtos e tabela de preco.
6. Evoluir orcamentos com itens, preco e WhatsApp.
7. Profissionalizar campanhas.
8. Criar dashboards gerenciais.
