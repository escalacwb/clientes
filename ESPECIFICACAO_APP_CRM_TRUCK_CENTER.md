# Especificação do App Web — CRM Comercial Capital Truck Center

**Versão:** 1.0  
**Data:** 28/05/2026  
**Projeto:** App web para gestão comercial, carteira de clientes, vendas, serviços, campanhas e histórico de relacionamento da Capital Truck Center.

---

## 1. Visão geral

O objetivo do app é transformar a base de clientes, vendas de pneus e serviços do Truck Center em uma ferramenta comercial de uso diário pelos vendedores e pela gerência.

A ideia principal é que o sistema não seja apenas uma lista de clientes. Ele deve funcionar como uma **central de carteira comercial**, mostrando quais clientes precisam ser trabalhados, por qual motivo, qual foi o histórico deles e qual a próxima ação recomendada.

O ERP mostra o que já aconteceu.  
O app deve mostrar o que precisa ser feito agora para vender de novo.

---

## 2. Arquivos e base de referência

A base inicial consolidada criada até agora é:

- `sell_out_final_com_vendas_e_servicos.xlsx`

Esse arquivo consolidou:

- clientes do sell-out original;
- clientes recuperados a partir do cadastro completo;
- clientes adicionados a partir das vendas;
- clientes adicionados a partir dos serviços;
- vendas por cliente;
- serviços por cliente;
- dados cadastrais disponíveis;
- origem do cadastro;
- vínculo com código ERP quando disponível.

Essa planilha deve ser usada como **base inicial de migração** para popular o banco do novo app.

Além dessa base inicial, o app deverá trabalhar com importações recorrentes de arquivos XML.

### Referência ao XML de importação

O XML diário será a entrada operacional para atualizar o histórico dos clientes. Ele deverá conter ou permitir extrair:

- identificação do cliente;
- CPF/CNPJ quando disponível;
- código do cliente no ERP quando disponível;
- nome ou razão social;
- data da venda ou serviço;
- número da nota ou pedido;
- produto vendido;
- serviço executado;
- modelo do pneu;
- medida do pneu;
- marca;
- quantidade;
- valor unitário;
- valor total;
- vendedor;
- unidade/empresa;
- placa ou observação, quando existir.

O sistema deve importar diariamente esse XML com todos os serviços e pneus vendidos por cliente, atualizando a situação de cada cliente.

Também deve permitir uma importação semanal da lista de clientes para atualizar dados cadastrais, telefones, responsáveis e demais campos.

---

## 3. Objetivo operacional

O app deve permitir que a Capital Truck Center:

1. Mantenha uma base única e limpa de clientes.
2. Atualize diariamente vendas e serviços por XML.
3. Atualize semanalmente dados cadastrais de clientes.
4. Distribua clientes para vendedores.
5. Permita que vendedores trabalhem suas carteiras.
6. Registre histórico de contatos e conversas.
7. Registre orçamentos e seus resultados.
8. Crie campanhas por WhatsApp com mensagens personalizadas.
9. Controle próximas ações e retornos.
10. Identifique clientes inativos, oportunidades de recompra e oportunidades de venda cruzada.
11. Gere relatórios gerenciais de atividade comercial, conversão e clientes em risco.

---

## 4. Conceito central

Cada cliente deve ter uma **ficha viva**.

Dentro dessa ficha devem ficar:

- dados cadastrais;
- contatos e responsáveis;
- vendas de pneus e produtos;
- serviços realizados;
- campanhas enviadas;
- conversas registradas;
- orçamentos;
- próximas ações;
- observações comerciais;
- tags;
- vendedor responsável;
- situação comercial atual.

O vendedor não deve trabalhar em uma planilha solta. Ele deve abrir o sistema e enxergar uma fila organizada de clientes que merecem ação.

---

## 5. Stack técnica recomendada

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui ou biblioteca visual equivalente
- TanStack Table para tabelas grandes
- React Hook Form para formulários
- Zod para validação
- Recharts para gráficos
- date-fns para datas

### Backend e banco

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security, quando necessário
- Supabase Storage para armazenar XMLs/planilhas importadas
- Supabase Edge Functions para importações e processamento

### Processamento auxiliar opcional

- Node.js para importações mais pesadas
- Python para limpeza de dados, cruzamentos complexos e scripts administrativos

### Decisão recomendada

Usar **TypeScript no app inteiro**, com React no frontend e Supabase/PostgreSQL no backend.

Python deve ser usado apenas como ferramenta auxiliar para importações pesadas, análise de dados ou rotinas administrativas.

---

## 6. Perfis de usuário

### Admin / Gerente

Pode:

- ver todos os clientes;
- importar XMLs;
- importar lista semanal de clientes;
- resolver conflitos de importação;
- ver relatórios gerais;
- criar campanhas;
- distribuir carteira entre vendedores;
- editar qualquer cliente;
- mesclar clientes duplicados;
- criar usuários;
- definir permissões;
- visualizar produtividade dos vendedores.

### Vendedor

Pode:

- ver clientes da própria carteira;
- registrar contatos;
- atualizar telefone, responsável e observações comerciais;
- criar orçamento;
- alterar status dos próprios orçamentos;
- usar botão de WhatsApp;
- criar próxima ação;
- registrar resultado de contato;
- consultar histórico de vendas e serviços dos seus clientes.

### Financeiro / Operação, opcional

Pode:

- consultar cliente;
- consultar histórico;
- visualizar vendas e serviços;
- não necessariamente alterar carteira comercial.

---

## 7. Módulos principais

## 7.1 Dashboard comercial

Tela inicial para gerente e vendedores.

Indicadores recomendados:

- clientes ativos;
- clientes sem compra há 30, 60, 90 e 180 dias;
- clientes que compraram pneus, mas não fizeram serviço;
- clientes que fizeram serviço, mas não compraram pneus;
- clientes com potencial de recompra;
- clientes com contato incompleto;
- clientes sem responsável comercial;
- clientes com próxima ação vencida;
- vendas por vendedor;
- contatos feitos por vendedor;
- orçamentos abertos;
- orçamentos ganhos;
- orçamentos perdidos;
- campanhas enviadas;
- clientes novos na semana.

Para o vendedor, o dashboard deve priorizar ação prática, não apenas gráficos.

Exemplo de blocos:

- Clientes para contatar hoje;
- Orçamentos parados;
- Oportunidades automáticas;
- Clientes novos;
- Próximos retornos;
- Clientes sem contato recente.

---

## 7.2 Cadastro único de clientes

O sistema deve ter uma base única de clientes, consolidando dados vindos de:

- sell-out;
- XML diário de vendas;
- XML diário de serviços;
- lista semanal de clientes;
- cadastro antigo do ERP;
- atualizações feitas pelos vendedores.

Campos principais:

- ID interno;
- código ERP;
- CPF/CNPJ;
- nome ou razão social;
- nome fantasia;
- tipo de cliente;
- cidade;
- UF;
- bairro;
- endereço;
- CEP;
- telefone principal;
- WhatsApp principal;
- e-mail;
- responsável principal;
- cargo do responsável;
- vendedor responsável;
- status comercial;
- origem do cadastro;
- data da primeira compra;
- data da última compra;
- data do último serviço;
- data do último contato;
- próxima ação;
- observações comerciais;
- tags;
- criado em;
- atualizado em.

### Tipos de cliente sugeridos

- Pessoa física;
- Transportadora;
- Fazenda;
- Agro;
- Autônomo;
- Empresa;
- Frota;
- Ônibus;
- Oficina;
- Revenda;
- Cliente balcão.

### Tags úteis

- Frota;
- Caminhão;
- Ônibus;
- Agro;
- Transportadora;
- Cliente Michelin;
- Cliente BFGoodrich;
- Alinhamento;
- Balanceamento;
- Recapagem;
- Inativo 90 dias;
- Alto potencial;
- Contato incompleto;
- Sem WhatsApp;
- Preço sensível;
- Cliente perdido;
- Cliente reativado;
- Não contatar.

---

## 7.3 Ficha do cliente

A ficha do cliente deve ser a tela mais importante do sistema.

### Cabeçalho

Deve mostrar:

- nome/razão social;
- cidade/UF;
- WhatsApp principal;
- vendedor responsável;
- status comercial;
- última compra;
- último serviço;
- total comprado;
- total em serviços;
- próxima ação;
- potencial comercial.

Botões rápidos:

- abrir WhatsApp;
- registrar contato;
- criar orçamento;
- agendar retorno;
- editar cadastro;
- marcar como não contatar.

### Abas da ficha

1. Resumo inteligente;
2. Vendas;
3. Serviços;
4. Conversas/interações;
5. Orçamentos;
6. Campanhas;
7. Dados cadastrais;
8. Timeline.

---

## 7.4 Resumo inteligente do cliente

Essa aba deve responder rapidamente:

> Quem é esse cliente e o que devo oferecer?

Exemplo:

> Cliente compra pneus de carga, principalmente 295/80R22.5. Já comprou Michelin e BFGoodrich. Fez alinhamento em março. Está há 142 dias sem compra. Sugestão: abordar sobre reposição e perguntar como está o desgaste dos pneus comprados anteriormente.

No MVP, esse resumo pode ser calculado por regras simples. No futuro, pode ser gerado por IA.

---

## 7.5 Vendas por cliente

Cada venda deve ser registrada em nível de item.

Campos:

- cliente_id;
- código do cliente ERP;
- data da venda;
- nota fiscal;
- pedido;
- código do produto;
- nome do produto;
- marca;
- modelo;
- medida;
- quantidade;
- valor unitário;
- valor total;
- vendedor;
- unidade/empresa;
- origem da importação;
- chave única de importação.

Filtros importantes:

- por período;
- por marca;
- por modelo;
- por medida;
- por vendedor;
- por tipo de produto;
- por quantidade;
- por valor.

---

## 7.6 Serviços por cliente

Cada serviço deve ser registrado em nível de item.

Campos:

- cliente_id;
- código do cliente ERP;
- data do serviço;
- pedido;
- serviço executado;
- quantidade;
- valor unitário;
- valor total;
- placa;
- observação;
- vendedor;
- unidade/empresa;
- origem da importação;
- chave única de importação.

Exemplos de serviços:

- alinhamento;
- balanceamento;
- cambagem;
- rodízio;
- montagem;
- conserto;
- geometria;
- serviços em caminhão/truck.

---

## 7.7 Conversas e interações

Todo contato comercial deve ficar registrado.

Campos:

- cliente_id;
- vendedor_id;
- data e hora;
- canal;
- tipo de contato;
- resumo;
- resultado;
- próxima ação;
- data da próxima ação;
- criado em.

Canais:

- WhatsApp;
- ligação;
- presencial;
- e-mail;
- campanha;
- outro.

Tipos de contato:

- prospecção;
- pós-venda;
- cobrança;
- orçamento;
- campanha;
- retorno;
- atualização cadastral;
- relacionamento.

Resultados:

- não atendeu;
- WhatsApp enviado;
- respondeu;
- pediu orçamento;
- pediu retorno depois;
- comprou;
- sem interesse;
- comprou de concorrente;
- telefone inválido;
- cadastro atualizado;
- não contatar.

Regra importante:

- Se marcar “pediu orçamento”, o sistema deve facilitar a criação de orçamento.
- Se marcar “retornar depois”, deve exigir uma data de próxima ação.
- Se marcar “comprou concorrente”, deve permitir informar motivo.

---

## 7.8 Orçamentos

O app deve controlar orçamentos mesmo que, no início, eles sejam preenchidos manualmente.

Campos do orçamento:

- cliente_id;
- vendedor_id;
- data do orçamento;
- status;
- valor total;
- validade;
- previsão de fechamento;
- forma de pagamento;
- motivo de perda;
- observação.

Campos dos itens:

- orçamento_id;
- produto/serviço;
- quantidade;
- valor unitário;
- valor total;
- observação.

Status:

- aberto;
- enviado;
- negociando;
- ganho;
- perdido;
- cancelado.

Motivos de perda:

- preço;
- prazo;
- cliente comprou de concorrente;
- sem estoque;
- não respondeu;
- condição de pagamento;
- produto errado;
- apenas cotação;
- outro.

---

## 7.9 Campanhas por WhatsApp

O sistema deve permitir criar campanhas filtrando clientes e gerando mensagens personalizadas para envio via `wa.me`.

### Fluxo

1. Usuário escolhe filtros.
2. Sistema gera lista de clientes.
3. Usuário escreve ou escolhe mensagem modelo.
4. Sistema substitui variáveis.
5. Vendedor abre WhatsApp pelo botão `wa.me`.
6. Após enviar, vendedor marca o status no app.
7. O envio fica registrado no histórico do cliente.

### Variáveis de mensagem

- `{nome_cliente}`;
- `{primeiro_nome}`;
- `{nome_vendedor}`;
- `{ultimo_produto}`;
- `{data_ultima_compra}`;
- `{data_ultimo_servico}`;
- `{modelo_pneu}`;
- `{cidade}`;
- `{empresa}`.

### Exemplos de campanhas

#### Clientes sem compra há 90 dias

Filtro:

- última compra há mais de 90 dias;
- tem WhatsApp válido;
- não contatado nos últimos 15 dias.

Mensagem exemplo:

> Bom dia, {primeiro_nome}. Tudo bem? Aqui é {nome_vendedor}, da Capital Truck Center. Vi aqui que faz um tempo desde sua última compra e estou passando para ver se precisa cotar pneus ou algum serviço para o caminhão.

#### Clientes que compraram 295/80R22.5

Filtro:

- compraram medida 295/80R22.5;
- última compra há mais de 90 dias;
- WhatsApp válido.

Mensagem exemplo:

> Bom dia, {primeiro_nome}. Tudo bem? Aqui é {nome_vendedor}, da Capital Truck Center. Vi aqui que você já comprou pneu 295/80R22.5 com a gente e estou passando para ver se precisa de reposição ou cotação atualizada.

#### Pós-serviço

Filtro:

- fizeram alinhamento ou balanceamento nos últimos 30 dias;
- não compraram pneus nos últimos 60 dias.

Mensagem exemplo:

> Bom dia, {primeiro_nome}. Tudo certo? Aqui é {nome_vendedor}, da Capital Truck Center. Vi que fizemos serviço no seu caminhão recentemente e queria saber se ficou tudo certo. Se precisar, também posso olhar uma condição para pneus ou manutenção preventiva.

### Observação importante sobre `wa.me`

O botão `wa.me` abre o WhatsApp com a mensagem pronta, mas o sistema não consegue garantir automaticamente que a mensagem foi enviada. Por isso, após abrir o WhatsApp, o vendedor deve confirmar manualmente:

- enviado;
- respondeu;
- não respondeu;
- virou orçamento;
- não contatar.

---

## 7.10 Minha carteira

Tela diária do vendedor.

Deve mostrar os clientes sob responsabilidade dele, priorizados por necessidade de ação.

Colunas recomendadas:

- prioridade;
- cliente;
- cidade;
- WhatsApp;
- última compra;
- último serviço;
- produto principal;
- total comprado;
- status;
- motivo da oportunidade;
- próxima ação;
- botão WhatsApp;
- botão registrar contato;
- botão criar orçamento.

Filtros:

- para contatar hoje;
- próxima ação vencida;
- sem compra há X dias;
- sem contato há X dias;
- comprou pneu específico;
- fez serviço específico;
- cidade;
- cliente sem vendedor;
- orçamento aberto;
- alto potencial;
- cliente novo;
- cadastro incompleto.

---

## 7.11 Fila de trabalho

O sistema deve gerar uma fila de prioridade para o vendedor.

Critérios sugeridos:

- orçamento aberto;
- próxima ação vencida;
- cliente de alto valor sem contato recente;
- cliente inativo com bom histórico;
- cliente novo sem contato;
- cliente com cadastro incompleto;
- cliente com oportunidade de recompra;
- cliente que fez serviço e pode comprar pneu;
- cliente que comprou pneu e pode fazer serviço.

Exemplo de pontuação simples:

| Critério | Pontos |
|---|---:|
| Orçamento aberto | +25 |
| Cliente comprou nos últimos 12 meses | +10 |
| Cliente sem compra há mais de 90 dias | +15 |
| Cliente comprou grande quantidade antes | +20 |
| Cliente tem WhatsApp válido | +10 |
| Cliente já respondeu contato antes | +10 |
| Cliente fez serviço recentemente | +10 |
| Cliente sem contato há mais de 60 dias | +15 |
| Cliente pediu para não contatar | bloqueia |

---

## 8. Situação comercial do cliente

O sistema deve trabalhar com status manual e status automático.

### Status manual

- Novo;
- Ativo;
- Em acompanhamento;
- Orçamento aberto;
- Sem resposta;
- Reativar;
- Inativo;
- Perdido;
- Bloqueado / não contatar.

### Status automático

- Comprou nos últimos 30 dias;
- Comprou entre 31 e 90 dias;
- Comprou entre 91 e 180 dias;
- Mais de 180 dias sem compra;
- Nunca comprou pneu;
- Nunca fez serviço;
- Cliente recorrente;
- Cliente de compra única;
- Cliente de alto valor;
- Cliente com risco de perda.

---

## 9. Importação diária de XML

O app deve permitir a importação diária de XMLs contendo vendas de pneus/produtos e serviços.

### Fluxo de importação

1. Usuário seleciona arquivo ou lote de arquivos XML.
2. Sistema identifica o tipo de documento.
3. Sistema extrai cliente, itens, valores, datas e vendedor.
4. Sistema tenta localizar o cliente existente.
5. Se encontrar com segurança, vincula os itens ao cliente.
6. Se não encontrar, busca na base de clientes cadastrados.
7. Se ainda não encontrar, cria cliente novo provisório.
8. Sistema mostra prévia da importação.
9. Usuário confirma.
10. Sistema grava vendas/serviços e atualiza situação do cliente.

### Dados mínimos esperados do XML

- documento do cliente;
- código ERP do cliente;
- nome do cliente;
- data;
- número da nota/pedido;
- produto ou serviço;
- quantidade;
- valor unitário;
- valor total;
- vendedor;
- unidade;
- placa/observação, quando existir.

### Identificação do cliente

Prioridade de vínculo:

1. Código ERP;
2. CPF/CNPJ;
3. telefone;
4. nome normalizado + cidade;
5. nome fantasia + telefone;
6. revisão manual.

### Prévia da importação

Antes de confirmar, mostrar:

- total de arquivos;
- total de notas/pedidos;
- total de itens;
- clientes encontrados;
- clientes novos;
- clientes com conflito;
- itens já importados antes;
- valor total.

---

## 10. Importação semanal de clientes

A importação semanal deve atualizar a base cadastral.

Ela pode atualizar:

- telefone;
- WhatsApp;
- endereço;
- cidade;
- UF;
- responsável;
- e-mail;
- CPF/CNPJ;
- nome fantasia;
- status cadastral;
- código ERP.

Regra importante:

> A importação semanal não deve apagar histórico comercial e não deve sobrescrever automaticamente dados manuais mais recentes cadastrados pelos vendedores.

No MVP, uma regra simples pode ser:

- preencher campos vazios automaticamente;
- registrar divergências para revisão;
- não substituir telefone/responsável manual mais recente sem confirmação.

---

## 11. Deduplicação e segurança dos dados

O sistema deve evitar duplicidade de clientes.

### Regras de identificação

Prioridade:

1. código ERP;
2. CPF/CNPJ;
3. telefone principal;
4. nome normalizado + cidade;
5. nome fantasia + telefone.

Quando houver dúvida, o sistema deve mandar para tela de conflitos.

### Possíveis conflitos

- mesmo CPF/CNPJ com nomes diferentes;
- mesmo telefone em clientes diferentes;
- mesmo nome com cidades diferentes;
- código ERP novo, mas CPF já existente;
- cliente sem documento;
- cliente com nome muito parecido;
- cliente com dados protegidos/incompletos.

### Tela de conflitos

Opções:

- unir clientes;
- manter separado;
- criar novo;
- ignorar;
- resolver depois.

---

## 12. Mesclagem de clientes

O sistema deve permitir mesclar clientes duplicados.

Ao mesclar:

- escolher cliente principal;
- mover vendas;
- mover serviços;
- mover contatos;
- mover orçamentos;
- mover campanhas;
- preservar dados antigos;
- registrar auditoria da mesclagem.

Nada deve ser perdido.

---

## 13. Auditoria

Como vários vendedores irão alterar dados, o sistema precisa registrar alterações importantes.

Auditar:

- alteração de telefone;
- alteração de WhatsApp;
- alteração de responsável;
- alteração de vendedor responsável;
- alteração de status;
- mesclagem de clientes;
- exclusões lógicas;
- importações;
- resolução de conflitos.

Campos de auditoria:

- usuário;
- data/hora;
- campo alterado;
- valor anterior;
- valor novo;
- origem da alteração.

---

## 14. LGPD e controle de acesso

O sistema terá dados pessoais e histórico de contato. Portanto, deve ter cuidados básicos:

- login individual por usuário;
- permissões por perfil;
- vendedor visualiza preferencialmente sua carteira;
- gerente visualiza todos;
- histórico de alterações;
- opção “não contatar”;
- cuidado com exportação massiva;
- registro da origem dos dados;
- exclusão lógica, não física, quando necessário.

---

## 15. Modelo de banco de dados sugerido

## 15.1 Tabelas principais

### `users`

Usuários do sistema.

Campos:

- id;
- nome;
- email;
- role;
- ativo;
- criado_em.

### `clientes`

Cadastro principal.

Campos:

- id;
- codigo_erp;
- cpf_cnpj;
- nome;
- nome_fantasia;
- tipo_cliente;
- cidade;
- uf;
- endereco;
- bairro;
- cep;
- telefone_principal;
- whatsapp_principal;
- email;
- responsavel_nome;
- responsavel_cargo;
- vendedor_id;
- status_comercial;
- origem;
- primeira_compra_em;
- ultima_compra_em;
- ultimo_servico_em;
- ultimo_contato_em;
- proxima_acao_em;
- score_oportunidade;
- criado_em;
- atualizado_em.

### `cliente_contatos`

Múltiplos contatos por cliente.

Campos:

- id;
- cliente_id;
- nome;
- cargo;
- telefone;
- whatsapp;
- email;
- principal;
- observacao;
- criado_em.

### `vendas_itens`

Itens vendidos.

Campos:

- id;
- cliente_id;
- codigo_cliente_erp;
- data_venda;
- nota;
- serie;
- pedido;
- produto_codigo;
- produto_nome;
- marca;
- modelo;
- medida;
- quantidade;
- valor_unitario;
- valor_total;
- vendedor_nome;
- unidade;
- importacao_id;
- chave_unica;
- criado_em.

### `servicos_itens`

Itens de serviços.

Campos:

- id;
- cliente_id;
- codigo_cliente_erp;
- data_servico;
- pedido;
- servico_codigo;
- servico_nome;
- quantidade;
- valor_unitario;
- valor_total;
- placa;
- observacao;
- vendedor_nome;
- unidade;
- importacao_id;
- chave_unica;
- criado_em.

### `interacoes`

Histórico comercial.

Campos:

- id;
- cliente_id;
- vendedor_id;
- data_interacao;
- canal;
- tipo;
- resumo;
- resultado;
- proxima_acao;
- data_proxima_acao;
- campanha_id;
- orcamento_id;
- criado_em.

### `tarefas`

Próximas ações.

Campos:

- id;
- cliente_id;
- vendedor_id;
- titulo;
- descricao;
- data_vencimento;
- status;
- prioridade;
- origem;
- concluida_em;
- criado_em.

### `orcamentos`

Orçamentos.

Campos:

- id;
- cliente_id;
- vendedor_id;
- data_orcamento;
- status;
- valor_total;
- validade;
- previsao_fechamento;
- forma_pagamento;
- motivo_perda;
- observacao;
- criado_em;
- atualizado_em.

### `orcamento_itens`

Itens do orçamento.

Campos:

- id;
- orcamento_id;
- descricao;
- tipo;
- quantidade;
- valor_unitario;
- valor_total;
- observacao.

### `campanhas`

Campanhas comerciais.

Campos:

- id;
- nome;
- descricao;
- mensagem_modelo;
- filtro_usado;
- criada_por;
- criada_em.

### `campanha_envios`

Envios por cliente.

Campos:

- id;
- campanha_id;
- cliente_id;
- vendedor_id;
- telefone;
- mensagem_final;
- status;
- data_abertura_whatsapp;
- data_marcado_enviado;
- resposta_cliente;
- virou_orcamento;
- virou_venda;
- criado_em.

### `importacoes`

Controle de importações.

Campos:

- id;
- tipo;
- arquivo_nome;
- arquivo_url;
- data_importacao;
- usuario_id;
- total_linhas;
- clientes_encontrados;
- clientes_criados;
- conflitos;
- itens_criados;
- itens_ignorados;
- status;
- criado_em.

### `importacao_conflitos`

Conflitos de importação.

Campos:

- id;
- importacao_id;
- tipo_conflito;
- dados_recebidos;
- possiveis_clientes;
- resolvido;
- cliente_escolhido_id;
- resolvido_por;
- resolvido_em.

### `cliente_alteracoes`

Auditoria de alterações.

Campos:

- id;
- cliente_id;
- usuario_id;
- campo;
- valor_anterior;
- valor_novo;
- origem;
- criado_em.

### `cliente_mesclagens`

Histórico de mesclagem.

Campos:

- id;
- cliente_principal_id;
- cliente_mesclado_id;
- usuario_id;
- motivo;
- dados_movidos;
- criado_em.

---

## 16. Timeline do cliente

Cada cliente deve ter uma linha do tempo única.

Eventos possíveis:

- venda realizada;
- serviço executado;
- WhatsApp enviado;
- ligação registrada;
- orçamento criado;
- orçamento ganho;
- orçamento perdido;
- campanha enviada;
- cadastro atualizado;
- próxima ação criada;
- próxima ação concluída;
- cliente mesclado.

Essa timeline pode ser montada a partir das tabelas de vendas, serviços, interações, orçamentos, campanhas e auditoria.

---

## 17. Inteligência comercial

O sistema deve gerar oportunidades automáticas.

### Oportunidades iniciais

- Cliente sem compra há 90 dias;
- Cliente sem compra há 180 dias;
- Cliente de alto valor sem contato recente;
- Cliente comprou pneus, mas não fez serviço;
- Cliente fez serviço, mas não comprou pneus;
- Cliente comprou medida específica e pode estar próximo de reposição;
- Cliente com orçamento aberto há muitos dias;
- Cliente novo sem vendedor;
- Cliente com cadastro incompleto;
- Cliente com WhatsApp inválido.

### Próxima melhor ação

Sugestões possíveis:

- ligar;
- enviar WhatsApp;
- fazer pós-venda;
- oferecer pneus;
- oferecer serviço;
- atualizar cadastro;
- retomar orçamento;
- confirmar necessidade futura.

---

## 18. Rotina diária do vendedor

Fluxo recomendado:

1. Vendedor faz login.
2. Abre “Minha rotina de hoje”.
3. Vê clientes priorizados.
4. Abre a ficha do primeiro cliente.
5. Consulta histórico resumido.
6. Usa botão de WhatsApp ou liga.
7. Registra o resultado.
8. Se necessário, cria orçamento.
9. Se necessário, agenda próxima ação.
10. Segue para o próximo cliente.

O sistema deve evitar que o vendedor precise procurar manualmente quem contatar.

---

## 19. Rotina diária do gerente

Fluxo recomendado:

1. Gerente acessa dashboard geral.
2. Verifica importações realizadas.
3. Confere conflitos pendentes.
4. Acompanha atividade dos vendedores.
5. Verifica orçamentos parados.
6. Cria ou ajusta campanhas.
7. Redistribui clientes sem responsável.
8. Analisa clientes importantes sem contato.
9. Avalia conversões e motivos de perda.

---

## 20. MVP recomendado

### Fase 1 — Base e importação

Objetivo: parar de depender de planilhas.

Funcionalidades:

- login;
- cadastro de clientes;
- importação da base inicial Excel;
- importação diária de XML;
- importação semanal de clientes;
- deduplicação por código ERP e CPF/CNPJ;
- ficha do cliente;
- histórico de vendas;
- histórico de serviços;
- clientes novos adicionados automaticamente;
- tela de conflitos.

### Fase 2 — CRM dos vendedores

Objetivo: vendedores começarem a trabalhar a carteira.

Funcionalidades:

- carteira por vendedor;
- registro de contato;
- próxima ação;
- status comercial;
- botão WhatsApp `wa.me`;
- mensagens modelo;
- histórico de conversas manual;
- filtros comerciais;
- dashboard do vendedor.

### Fase 3 — Campanhas e orçamento

Objetivo: transformar base em venda.

Funcionalidades:

- criador de campanha;
- filtros para campanha;
- mensagem com variáveis;
- envio individual por WhatsApp;
- registro de campanha enviada;
- orçamentos;
- status do orçamento;
- motivo de perda;
- relatório de conversão.

### Fase 4 — Inteligência comercial

Objetivo: sistema sugerir oportunidades.

Funcionalidades:

- score de cliente;
- sugestão de recompra;
- cliente inativo;
- cliente em risco;
- oportunidade de serviço;
- oportunidade de pneu;
- ranking de clientes;
- ranking por cidade;
- ranking por modelo/medida;
- acompanhamento de vendedor.

### Fase 5 — IA futura

Funcionalidades possíveis:

- resumo automático do cliente;
- sugestão de mensagem WhatsApp;
- classificação de conversa colada pelo vendedor;
- sugestão de próxima ação;
- detecção de padrões de recompra;
- alerta de cliente sumindo.

---

## 21. Telas do MVP

1. Login;
2. Dashboard;
3. Importações;
4. Clientes;
5. Ficha do cliente;
6. Minha carteira;
7. Campanhas;
8. Orçamentos;
9. Relatórios;
10. Conflitos de importação;
11. Usuários e permissões.

---

## 22. Regras para evitar duplicidade de XML

Se o mesmo XML for importado duas vezes, o sistema não pode duplicar vendas ou serviços.

Criar chave única por item usando combinação de:

- número da nota;
- série;
- código do cliente;
- código do produto/serviço;
- número do item;
- data;
- quantidade;
- valor.

Se já existir:

- ignorar;
- ou atualizar somente se houver diferença controlada.

---

## 23. O que evitar no começo

Evitar no MVP:

- integração direta com WhatsApp Business API;
- automação de mensagem em massa;
- funil comercial complexo demais;
- app mobile nativo;
- ERP completo;
- emissão de nota;
- controle financeiro avançado;
- estoque completo;
- IA decidindo tudo sozinha.

Primeiro o sistema precisa responder:

> Quem são meus clientes, o que compraram, quando devo falar com eles e o que aconteceu depois do contato?

---

## 24. Diferencial do app

O diferencial não é apenas ter cadastro de cliente.

O diferencial é cruzar:

- sell-out;
- vendas;
- serviços;
- contatos;
- orçamentos;
- campanhas;
- responsável comercial;
- importações diárias;
- lista semanal de clientes.

E transformar isso em:

> Este cliente precisa ser trabalhado agora, por este motivo, com esta abordagem.

Esse é o coração do sistema.

---

## 25. Próximo passo técnico

A partir deste documento, o próximo passo é criar:

1. schema SQL inicial no Supabase;
2. seed/migração da base `sell_out_final_com_vendas_e_servicos.xlsx`;
3. parser de XML de vendas e serviços;
4. tela de importação;
5. tela de clientes;
6. ficha do cliente;
7. tela “Minha carteira”;
8. botão `wa.me` com mensagem personalizada;
9. registro de contato;
10. regras iniciais de oportunidade.

---

## 26. Nome provisório do projeto

Sugestões:

- Capital CRM Comercial;
- Central de Carteira Capital Truck;
- Capital Truck CRM;
- Capital Sales OS;
- CRM Truck Center.

Nome recomendado internamente:

**Central de Carteira Capital Truck**

Porque deixa claro que o objetivo é trabalhar carteira, não apenas cadastrar cliente.

---

## 27. Resumo executivo

O app será uma central comercial baseada em dados reais de vendas, serviços e clientes.

Ele será alimentado por:

- base inicial consolidada em Excel;
- XML diário de vendas e serviços;
- lista semanal de clientes.

Ele será usado por:

- vendedores, para trabalhar carteira e registrar contatos;
- gerente, para acompanhar desempenho e oportunidades;
- operação, para consultar histórico quando necessário.

O sistema deve priorizar:

- organização da base;
- histórico por cliente;
- importação segura;
- deduplicação;
- botão WhatsApp;
- registro de conversas;
- orçamento;
- campanhas;
- fila de trabalho;
- oportunidades automáticas.

A primeira versão deve ser simples, mas já pensada para evoluir para inteligência comercial e IA no futuro.
