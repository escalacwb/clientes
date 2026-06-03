# Auditoria de fluxos CRM + Patio - 2026-06-02

## Objetivo

Avaliar o app como uma equipe pequena usaria no dia a dia, sem buscar novas telas bonitas. O foco foi identificar o que facilita ou atrapalha:

- rotina diaria do vendedor;
- campanhas e retorno por WhatsApp;
- ficha do cliente;
- proposta/orcamento;
- revisao proativa e feedback do patio;
- fluxo operacional do patio.

## Referencias usadas

- HubSpot Sequences: filas de tarefas, lembretes e follow-up por etapa.
  https://knowledge.hubspot.com/sequences/create-and-edit-sequences
- Pipedrive Activities/Goals: atividades como unidade de trabalho e alertas de negocio parado.
  https://www.pipedrive.com/en/features/activities-goals
- Pipedrive Sequences: fluxos lineares com emails e tarefas para nutrir leads.
  https://support.pipedrive.com/en/article/sequences
- Zoho CRM Cadences: cadencias para follow-up consistente ate um resultado desejado.
  https://www.zoho.com/crm/cadences.html

## Resultado geral

O problema principal do CRM nao e falta de ferramenta. E excesso de caminhos soltos.

O vendedor precisa de uma fila unica de trabalho que diga:

1. quem atender agora;
2. por que esse cliente apareceu;
3. qual contato usar;
4. qual acao fazer;
5. o que acontece depois do registro.

Hoje o app tem muitos recursos bons, mas campanha, ficha, proposta e rotina ainda nao estao unidos por um fluxo simples de "proxima acao".

## Fluxo 1 - Rotina diaria do vendedor

### Teste executado

Login como William Brandenburg.

### O que funcionou

- O vendedor ve apenas CRM, Patio e menus reduzidos.
- A rotina mostra clientes, oportunidades e atalhos.
- A ficha abre com contexto do cliente.

### Problemas encontrados

- A tela ainda usa muitos conceitos internos: score, oportunidade, fila automatica, sem proxima acao.
- Na rotina, "alto valor" apareceu como primeira acao, mas sem explicar claramente qual abordagem o vendedor deve fazer.
- A fila mostra muitos botoes e categorias, mas o vendedor ainda precisa decidir sozinho se deve ligar, mandar WhatsApp, criar proposta ou criar follow-up.
- O carregamento inicial dispara muitas consultas antes do vendedor agir, causando demora e estados "Carregando".

### Mudanca que vale a pena

Transformar "Minha rotina" em uma fila de execucao, nao em painel.

Ordem sugerida:

1. cliente respondeu ou precisa retorno de campanha;
2. tarefas vencidas/hoje;
3. proposta vencida ou sem follow-up;
4. revisao proativa;
5. feedback patio;
6. cliente sem cadastro/lista externa;
7. cliente inativo automatico.

Cada item deve ter no maximo 3 acoes primarias:

- WhatsApp;
- Registrar resultado;
- Nova proposta/Ficha.

## Fluxo 2 - Campanhas e WhatsApp

### Teste executado

Criada campanha de teste como vendedor e como admin. Fluxo testado:

1. montar publico;
2. escrever texto;
3. salvar campanha;
4. enviar/marcar envio;
5. marcar respondeu;
6. abrir retorno;
7. transformar em orcamento.

### O que funcionou

- Como admin, campanha salva.
- Como admin, status de envio pode ser alterado.
- "Fazer orcamento" abre editor de proposta com origem da campanha.

### Problemas criticos

- Como vendedor, salvar campanha retornou 403.
- Como vendedor, atualizar envio retornou 403.
- O vendedor ve "526 clientes na sua visao", mas o publico de campanha mostrou 12.393 clientes. Isso e incoerente e pode ser vazamento operacional/permissao.
- Filtro por Dourados/MS exibiu contadores inconsistentes: topo com 1 cliente, fila com 50 clientes.
- A campanha permite avancar sem salvar, mas depois o fluxo perde referencia e nao aparece no seletor.
- A etapa de retorno contou "1 respondido", mas o inbox ficou vazio.
- "Sem resposta" aparece como acao direta, mas na vida real a resposta pode vir horas ou dias depois.
- A fila de envio tem muitas acoes repetidas por linha: Abrir, Editar contato, Marcar enviado, Respondeu, Fazer orcamento, Mais acoes.

### Mudanca que vale a pena

Reorganizar campanha como uma cadencia simples:

1. **Rascunho**: publico + texto + nome.
2. **Fila para enviar**: apenas clientes prontos.
3. **Aguardando resposta**: tudo que teve WhatsApp aberto ou marcado enviado.
4. **Retornos**: respondeu, pediu orcamento, comprar depois, nao contatar.
5. **Encerrados**: ganho, perdido, sem resposta final.

O clique em WhatsApp deve criar/atualizar um registro com:

- status: aguardando_resposta;
- enviado_em;
- proxima_checagem_em;
- vendedor_id;
- telefone usado;
- campanha_id;
- mensagem final.

O vendedor nao deve "cacar" cliente depois. A rotina deve trazer "enviado ha X horas/dias".

## Fluxo 3 - Ficha do cliente

### Teste executado

Aberta ficha de cliente da rotina. Registrado contato com resultado "Comprar depois".

### O que funcionou bem

- A ficha e a melhor tela do CRM hoje.
- Mostra motivo da prioridade.
- Mostra contato recomendado vindo do patio.
- Mostra produto principal, servico recorrente, ultima passagem, placa e KM.
- Salvar atendimento criou tarefa automaticamente.
- Apos salvar, a ficha mostra "Ultimo atendimento" e tarefa aberta.

### Problemas encontrados

- O resultado selecionado nao fica visualmente forte antes de salvar.
- O prazo sugerido para "comprar depois" apareceu em 30 dias, mas sem explicar o criterio.
- Texto com acento digitado no teste apareceu com caracteres quebrados.
- A ficha mostra muita informacao util, mas ainda mistura cadastro, sinais comerciais, patio e historico em uma tela longa.

### Mudanca que vale a pena

Transformar o bloco "Atendimento agora" no centro da ficha:

- contato recomendado;
- ultimo motivo da fila;
- resultado do contato;
- proxima acao;
- data;
- botao principal dinamico:
  - Pediu orcamento -> Salvar e montar proposta;
  - Comprar depois -> Salvar e agendar retorno;
  - Sem resposta -> Salvar aguardando checagem;
  - Fechou pedido -> Salvar ganho;
  - Nao contatar -> Bloquear contato.

## Fluxo 4 - Proposta/orcamento

### Teste executado

Criado orcamento a partir da ficha e a partir de campanha. Buscado item 295/80 no catalogo e selecionado produto.

### O que funcionou

- Busca de catalogo por medida funciona.
- Selecionar item adiciona produto ao orcamento.
- Origem da proposta aparece corretamente quando vem da campanha.
- Condicoes e preview aparecem no editor.

### Problemas encontrados

- Quando a proposta nasce da ficha, o sistema ja sabe produto principal e servico recorrente, mas o editor comeca zerado.
- O vendedor precisa lembrar ou redigitar o produto historico.
- O editor e poderoso, mas visualmente denso.

### Mudanca que vale a pena

Criar uma "proposta guiada" quando vier da ficha/campanha:

- sugestao 1: ultimo pneu comprado;
- sugestao 2: medida mais comprada;
- sugestao 3: servico recorrente;
- sugestao 4: complementares usuais.

O vendedor poderia clicar "Adicionar sugestoes" e depois ajustar.

## Fluxo 5 - Feedback patio

### Teste executado

Aberta tela de feedback patio.

### O que funcionou

- A tela carrega feedbacks reais.
- Os servicos feitos aparecem na mensagem/lista.
- Mostra contato, placa, data, KM e servicos.

### Problemas encontrados

- Carregamento demorou muito. Em teste, a tela ficou em "Carregando..." tempo suficiente para parecer vazia.
- Existem 1.679 feedbacks pendentes no banco, mas a UI inicial pode mostrar 0 enquanto carrega.
- O fluxo recomenda bem os passos, mas ainda e uma lista grande sem priorizacao clara.

### Mudanca que vale a pena

Feedback patio deve virar fila operacional menor:

- hoje/ultimos 3 dias primeiro;
- servico com maior chance comercial primeiro;
- clientes com contato atualizado primeiro;
- ocultar feedbacks muito antigos em uma aba secundaria.

O objetivo nao e ligar para 1.679 pessoas. E tratar retornos recentes e relevantes.

## Fluxo 6 - Revisao proativa

### Teste executado

Aberta revisao proativa e aguardado carregamento.

### O que funcionou

- A tela carregou 257 veiculos.
- Mostra placa, cliente, contato, ultima visita, KM estimado e acoes.

### Problemas encontrados

- Muitos KMs estimados sao absurdos: 14.521.624 km desde a ultima visita, por exemplo.
- Com outliers assim, o vendedor perde confianca na ferramenta.
- A tela so fica util depois de sanear KM medio/ultimo KM.

### Mudanca que vale a pena

Antes de vender revisao proativa como ferramenta diaria, criar saneamento de KM:

- bloquear media diaria acima de limite razoavel;
- marcar "media suspeita";
- exigir ajuste antes de aparecer na fila principal;
- separar "revisao confiavel" de "revisao precisa validar KM".

## Fluxo 7 - Patio operacional

### Teste executado

Fluxo completo:

1. buscar placa;
2. iniciar entrada;
3. adicionar servico por atalho;
4. enviar para fila;
5. alocar em box;
6. finalizar box.

### O que funcionou bem

- Busca de placa funcionou.
- Entrada abre com KM, motorista e contato.
- Atalhos "+ servico" adicionam direto.
- Envio para fila funcionou.
- Alocacao em box funcionou.
- Finalizacao de box funcionou.
- Fila e boxes ficaram coerentes depois da operacao.

### Problemas encontrados

- Busca de placa demora o bastante para parecer travada se o usuario nao esperar.
- O botao "Adicionar servico digitado" gera erro quando o usuario acabou de adicionar pelo atalho. Ele fica competindo com os atalhos.
- A alocacao exige selecionar area, box e funcionario manualmente mesmo quando so existe uma area pendente.

### Mudanca que vale a pena

Manter o patio como esta, com ajustes pequenos:

- loading claro na busca de placa;
- se clicar atalho, esconder/baixar prioridade do "Adicionar servico digitado";
- preselecionar area quando so houver uma;
- sugerir primeiro box livre;
- sugerir funcionario padrao/ultimo funcionario da area.

## Queue priorizada

### P0 - Corrigir campanha para vendedor

Impacto: sem isso, campanha nao pode ser usada pela equipe.

- Permitir vendedor salvar campanha propria.
- Permitir vendedor atualizar envio proprio.
- Respeitar carteira/visao do vendedor no publico.
- Corrigir contadores publico/fila.
- Retornos devem listar enviados/respondidos corretamente.

### P0 - Transformar WhatsApp enviado em "aguardando resposta"

Impacto: resolve o problema real de resposta assincrona.

- Ao abrir WhatsApp ou marcar enviado, criar proxima checagem.
- Mostrar "Aguardando resposta" na rotina.
- Nao exigir que vendedor procure cliente manualmente.

### P1 - Reorganizar Minha rotina

Impacto: reduz abandono.

- Mostrar fila unica por ordem operacional.
- Limitar acoes por item.
- Explicar motivo em linguagem de trabalho.

### P1 - Melhorar ficha como central de atendimento

Impacto: aumenta uso diario.

- Deixar atendimento agora mais evidente.
- Botao principal por resultado.
- Mostrar proxima acao gerada depois de salvar.
- Corrigir acentuacao/texto salvo.

### P1 - Proposta guiada por historico

Impacto: reduz tempo de cotacao.

- Sugerir pneu historico, medida, servico recorrente e complementares.
- Criar "Adicionar sugestoes da ficha".

### P1 - Saneamento da revisao proativa

Impacto: evita perda de confianca.

- Media suspeita nao entra na fila principal.
- Criar fila "validar KM".
- Limites de KM por dia configuraveis.

### P2 - Feedback patio priorizado

Impacto: torna a lista executavel.

- Priorizar recentes.
- Separar antigos.
- Mostrar motivo comercial.

### P2 - Ajustes finos do patio

Impacto: menos clique sem mudar fluxo.

- Loading melhor na busca.
- Preselecao na alocacao.
- Evitar botao conflitante em servico digitado.

## Conclusao

O patio operacional esta utilizavel e deve ser preservado. O CRM tem bons dados e uma ficha promissora, mas campanha e rotina precisam virar fluxo de trabalho real.

A prioridade nao e criar novas telas. E conectar:

campanha -> WhatsApp enviado -> aguardando resposta -> retorno -> proposta/tarefa -> ficha.

Esse e o fluxo que mais deve impactar resultado comercial e adesao dos vendedores.
