# Arquitetura do App Combinado CRM + Patio

## Objetivo

Construir um unico app operacional para a Capital Truck Center, onde o Controle de Patio continua sendo o fluxo principal da loja e o CRM funciona como camada comercial de alto valor.

O CRM nao deve competir com o patio nem criar trabalho duplicado. Ele deve transformar dados operacionais em acao comercial simples:

- feedback;
- recompra;
- revisao proativa;
- proposta;
- campanha;
- follow-up.

## Principio de produto

O app final deve ter modos de trabalho, nao apenas menus misturados.

O usuario alterna entre:

- `Patio`: operacao diaria, rapida e objetiva;
- `CRM`: comercial, carteira, propostas e campanhas;
- `Gestao`: administracao, importacoes, usuarios, conflitos e auditoria.

Cada modo tem menu proprio, linguagem propria e telas proprias.

## Hierarquia do app

### Modo Patio

Publico principal:

- atendente;
- consultor operacional;
- lider de patio;
- gestor quando precisar acompanhar fila.

Objetivo:

- registrar entrada;
- controlar execucao;
- finalizar atendimento;
- manter dados de placa, KM, motorista e responsavel atualizados;
- alimentar sinais para feedback e revisao proativa no CRM sem atrapalhar a operacao.

Telas:

1. **Entrada**
   - buscar placa;
   - ver cliente/veiculo encontrado;
   - cadastrar novo cliente/veiculo quando necessario;
   - atualizar motorista e contato;
   - selecionar servicos;
   - abrir WhatsApp operacional.

2. **Fila**
   - veiculos aguardando;
   - servicos pendentes;
   - prioridade;
   - alocar em box.

3. **Boxes**
   - visao dos boxes;
   - veiculo em atendimento;
   - servicos em execucao;
   - finalizar;
   - cancelar/reverter quando necessario.

4. **Concluidos**
   - historico recente;
   - servicos finalizados;
   - ajuste pontual de status;
   - reverter atendimento, com controle.

5. **Historico por placa**
   - consulta rapida;
   - KM;
   - servicos;
   - cliente vinculado;
   - motorista mais recente.

### Modo CRM

Publico principal:

- vendedores;
- gerente comercial;
- administrador.

Objetivo:

- transformar sinais do patio e importacoes em rotina comercial;
- reduzir abandono;
- manter o vendedor em uma tela simples de acao.

Telas:

1. **Minha rotina**
   - tarefas do dia;
   - clientes para responder;
   - propostas para retomar;
   - feedbacks pendentes atribuidos;
   - revisoes proativas com potencial;
   - oportunidades geradas pelo patio.

2. **Clientes**
   - busca;
   - filtros simples;
   - carteira;
   - clientes sem cadastro/origem externa;
   - acesso a ficha 360.

3. **Ficha 360**
   - motivo de estar na rotina;
   - contato recomendado;
   - historico comercial;
   - historico do patio;
   - veiculos;
   - vendas de pneus;
   - servicos faturados;
   - atendimentos executados;
   - campanhas;
   - propostas;
   - atendimento agora.

4. **Propostas**
   - criar proposta solta;
   - selecionar cliente;
   - itens por bloco;
   - condicoes por bloco;
   - PDF profissional;
   - mensagem WhatsApp editavel;
   - historico de versoes.

5. **Campanhas**
   - criar campanha salva;
   - escolher publico;
   - validar lista filtrada;
   - editar mensagem;
   - abrir WhatsApp;
   - controlar retorno.

6. **Oportunidades**
   - sinais gerados por importacao;
   - sinais gerados pelo patio;
   - sinais gerados por campanhas/propostas;
   - converter em tarefa, proposta ou campanha.

7. **Catalogo**
   - produtos;
   - servicos;
   - listas de preco;
   - atualizacao separada.

8. **Feedback pos-servico**
   - pendencias geradas pelo patio;
   - abrir WhatsApp;
   - marcar feedback feito;
   - registrar observacao simples;
   - criar tarefa/oportunidade quando houver interesse.

9. **Revisao proativa**
   - veiculos por KM estimado ou tempo sem retorno;
   - abrir WhatsApp;
   - marcar contato realizado;
   - medir retorno da placa em ate 15 dias em fase posterior;
   - criar oportunidade/proposta quando houver interesse.

### Modo Gestao

Publico principal:

- Wagner/admin;
- gerente;
- usuarios autorizados.

Objetivo:

- manter app saudavel;
- evitar dados quebrados;
- acompanhar carteira e importacoes.

Telas:

1. **Importacoes**
   - arquivos diarios;
   - catalogo;
   - listas externas;
   - validacao;
   - status.

2. **Equipe**
   - vendedores;
   - distribuicao de carteira;
   - usuarios sem carteira;
   - responsabilidade comercial.

3. **Conflitos**
   - cliente duplicado;
   - placa em cliente divergente;
   - cliente patio sem match;
   - cliente CRM sem patio;
   - contato divergente.

4. **Auditoria**
   - alteracoes de clientes;
   - exclusoes;
   - mesclagens;
   - importacoes;
   - acoes sensiveis.

5. **Configuracoes**
   - regras de oportunidade;
   - parametros de revisao proativa;
   - textos padrao;
   - permissoes.

## Entidades centrais

### Cliente mestre

Tabela principal: `clientes`.

Guarda identidade comercial:

- codigo ERP;
- nome;
- documento quando existir;
- cidade/UF;
- vendedor responsavel;
- status comercial;
- origem;
- totais historicos.

Nao deve ser sobrescrito cegamente por dados do patio.

### Contatos

Tabela principal: `cliente_contatos`.

Guarda multiplos contatos por cliente:

- cadastro;
- responsavel;
- motorista;
- compras;
- financeiro;
- operacional.

Regra:

- patio tem prioridade para contato recente de motorista/responsavel;
- CRM/importacao tem fallback;
- vendedor pode validar, invalidar ou tornar principal;
- contato novo nao apaga contato antigo.

### Veiculo mestre

Tabela principal: `veiculos`.

Guarda placa, chassi, descricao, KM e cliente vinculado.

Regra:

- placa e o identificador operacional mais importante;
- se placa aparecer em cliente diferente, gerar conflito;
- nao mover automaticamente sem revisao.

### Atendimento de patio

Tabela principal final: `patio_atendimentos`.

Guarda:

- execucao;
- veiculo;
- cliente;
- box;
- funcionario;
- KM;
- inicio/fim;
- motorista;
- contato;
- feedback.

### Itens de atendimento

Tabela principal final: `patio_atendimento_itens`.

Une:

- borracharia;
- alinhamento;
- manutencao.

Cada item deve apontar para:

- atendimento;
- cliente;
- veiculo;
- area;
- servico;
- quantidade;
- status;
- observacoes.

### Historico comercial

Tabelas:

- `vendas_itens`;
- `servicos_itens`;
- `ordens_movimento`.

Essas tabelas representam importacao/faturamento, nao execucao real do patio.

## Fluxos principais

### Fluxo 1: entrada no patio

1. usuario informa placa;
2. app busca em `veiculos` e snapshots do patio;
3. se encontrar, mostra cliente e historico curto;
4. usuario confirma/atualiza motorista e contato;
5. usuario seleciona servicos;
6. app cria atendimento e itens;
7. CRM recebe sinal se houver proposta aberta ou oportunidade relevante.

Nao mostrar CRM pesado nessa etapa.

### Fluxo 2: finalizacao no patio

1. funcionario finaliza box;
2. app grava KM e fim;
3. app atualiza ultimo atendimento do veiculo;
4. app atualiza contato operacional se informado;
5. app cria pendencia de feedback quando aplicavel;
6. app alimenta oportunidades de CRM.

### Fluxo 3: feedback pos-servico

1. app lista atendimentos finalizados sem feedback;
2. usuario abre WhatsApp;
3. usuario marca feedback feito;
4. se cliente demonstrar interesse, vira interacao/tarefa no CRM;
5. feedback nao precisa virar oportunidade sempre.

### Fluxo 4: revisao proativa

1. app calcula veiculos por KM estimado e tempo sem retorno;
2. usuario abre WhatsApp pelo contato recomendado;
3. se cliente responder com interesse, cria oportunidade ou proposta no CRM;
4. se contato for feito sem interesse, marca revisao proativa realizada.

### Fluxo 5: rotina comercial

1. vendedor abre CRM;
2. ve prioridades misturadas por importancia, nao por origem;
3. cada item explica porque apareceu;
4. vendedor abre ficha 360;
5. app mostra contato recomendado e contexto;
6. vendedor registra resultado;
7. app cria proxima tarefa se necessario.

## Oportunidades geradas entre sistemas

### Patio para CRM

- atendimento recente sem feedback;
- contato de motorista/responsavel mais novo que cadastro;
- servico de pneu sem venda de pneu importada;
- venda de pneu sem montagem/alinhamento/balanceamento no patio;
- veiculo com KM estimado alto;
- cliente com proposta aberta apareceu no patio;
- cliente sem vendedor apareceu no patio;
- placa nova de cliente ativo;
- cliente externo virou cliente operacional.

### CRM para Patio

- proposta aberta quando cliente entra no patio;
- cliente em negociacao;
- historico de medida/marca de pneus;
- alerta de cadastro conflitante;
- bloqueio de nao contatar, quando relevante.

## Mobile

No mobile o app deve priorizar acao rapida.

### Mobile Patio

- buscar placa;
- cadastrar entrada;
- ver fila;
- finalizar atendimento;
- abrir WhatsApp de feedback;
- revisao proativa.

### Mobile CRM

- minha rotina;
- buscar cliente;
- ficha resumida;
- abrir WhatsApp;
- campanha salva;
- proposta rapida.

### Mobile Gestao

Nao precisa expor importacoes, auditorias completas ou configuracoes pesadas.

## Permissoes

### Operacao

Pode:

- usar patio;
- registrar entrada;
- atualizar motorista/contato operacional;
- finalizar atendimento.

Nao pode:

- alterar carteira;
- excluir dados comerciais;
- mexer em importacao;
- alterar proposta comercial.

### Vendedor

Pode:

- usar CRM;
- ver carteira;
- criar proposta;
- registrar interacao;
- enviar campanha;
- usar feedback/revisao quando atribuido.

Nao deve:

- alterar dados operacionais sensiveis do patio;
- excluir historico.

### Admin/Gestao

Pode tudo, com auditoria.

## Telas atuais que devem ser fundidas ou removidas

### Fundir

- Cockpit e Dashboard: virar `Minha rotina`.
- Oportunidades e parte de tarefas: aparecer na rotina com filtros.
- Clientes sem cadastro: virar filtro/origem dentro de Clientes e Campanhas, nao menu isolado no CRM principal.
- Feedback e Revisao: ficam no modo CRM; o Patio apenas gera os sinais operacionais.

### Manter

- Clientes;
- Ficha 360;
- Propostas;
- Campanhas;
- Catalogo;
- Importacoes;
- Equipe;
- Auditoria.

### Remover do mobile

- importacoes;
- auditoria;
- mesclagem;
- configuracoes complexas;
- relatorios pesados.

## Criterio de pronto

O app combinado so deve ser considerado pronto quando:

- alternancia Patio/CRM/Gestao muda menu e contexto;
- nenhuma tela importante fica duplicada;
- entrada do patio nao exige acao comercial;
- CRM mostra sinais do patio com motivo claro;
- ficha 360 mostra historico comercial e operacional juntos;
- feedback e revisao proativa funcionam pelo CRM integrado;
- vendedores conseguem trabalhar por rotina simples;
- mobile tem fluxo proprio, nao apenas CSS responsivo;
- Supabase do patio antigo continua intacto ate a migracao final.
