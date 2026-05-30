# Queue de auditoria de fluxos CRM - 2026-05-29

## Metodo usado

- App local em `http://127.0.0.1:5173`.
- Login testado como:
  - Admin: Wagner Fonseca.
  - Vendedor comum: William Brandenburg.
- Varredura Playwright por menus, fluxos e erros de rede/console.
- Comparacao de produto com referencias oficiais:
  - Pipedrive: CRM moderno deve ter pipeline visual, automacao, comunicacao e logica orientada a atividades.
  - Freshsales: atividades, outcomes, tarefas, WhatsApp, timeline 360, scoring, catalogo de produtos, forecast e audit logs.
  - Zoho CRM SFA: cotacoes rapidas, precos confiaveis, pipeline unico, follow-ups automatizados e previsao.
  - monday CRM: automacoes, comunicacao centralizada e pipeline sem troca de abas.

## Achados principais

### A01 - Vendedor comum sem carteira funcional

Status: Concluido.

Evidencia:
- William entrou corretamente, mas apareceu com 0 clientes, 0 tarefas, 0 oportunidades, 0 campanhas e 0 propostas.
- A tela fica tecnicamente correta, mas comercialmente inutil para um vendedor.

Impacto:
- Nao conseguimos validar rotina real do vendedor William.
- O CRM parece vazio para vendedor sem carteira atribuida.

Acao:
- Criar fluxo admin de distribuicao inicial obrigatoria.
- Mostrar banner para admin quando houver vendedores sem carteira.
- Para vendedor sem carteira, mostrar estado util: "sem carteira atribuida" + contatos de suporte/admin, em vez de parecer base vazia.

Execucao:
- Admin passa a ver alerta operacional com vendedores sem carteira e atalho direto para `Distribuir carteira`.
- Vendedor com 0 clientes deixa de ver o cockpit vazio como tela principal e recebe estado claro orientando atribuir carteira pelo admin.
- Revalidacao local: Wagner ve alerta para William; William ve estado de carteira nao atribuida.

### A02 - Erro 500 ao carregar servicos de cliente

Status: Em execucao.

Evidencia:
- Durante fluxo admin de cliente/Ficha 360 houve HTTP 500 em `rest/v1/servicos_itens`.

Impacto:
- A Ficha 360 pode falhar justamente onde deveria mostrar historico de servicos.

Acao:
- Limitar queries de historico por cliente com paginacao/limite inicial.
- Trocar `select('*')` por colunas necessarias.
- Adicionar tratamento visual quando uma aba falha, sem derrubar a ficha inteira.

Execucao:
- Query inicial de vendas/servicos por cliente limitada a 500 linhas e colunas explicitas.
- Revalidacao local nao reproduziu o HTTP 500.
- Novo achado tecnico: lista de clientes emite warning React de keys duplicadas; tratar no A09.

### A03 - Criacao de orcamento a partir de cliente nao ficou confiavel no teste

Status: Concluido.

Evidencia:
- Botao de orcar existia, mas o teste automatizado nao chegou ao editor com confianca.

Impacto:
- Fluxo comercial central ainda parece depender de contexto/selecionamento correto.

Acao:
- Padronizar CTA unico: `Nova proposta`.
- Em qualquer cliente/ficha/lista, esse CTA deve abrir o editor com cliente selecionado.
- Se nao houver cliente selecionado, abrir busca de cliente antes do editor.

Execucao:
- Criado fluxo unico para abrir proposta garantindo cliente em memoria antes do editor.
- CTA global `Nova proposta` agora abre busca de cliente quando nao ha cliente selecionado.
- Lista de clientes, Ficha 360, Tarefas, Campanhas, Cockpit e Orcamentos passam pelo mesmo fluxo.
- Revalidacao local: admin abriu `Nova proposta`, buscou `energia`, selecionou cliente e entrou no editor com `Proposta para...` sem erro de console/rede no fluxo.

### A04 - Menus ainda fragmentam fluxo diario

Status: Concluido.

Evidencia:
- Cockpit, Tarefas, Oportunidades, Campanhas e Orcamentos se sobrepoem como filas de trabalho.

Impacto:
- O vendedor precisa entender qual tela usar, em vez de seguir uma rotina unica.

Acao:
- Criar `Minha rotina` como tela operacional principal do vendedor.
- Consolidar: tarefas do dia, campanhas para responder, propostas para retomar, oportunidades e clientes sem proxima acao.
- Manter telas especializadas como detalhe/gestao, nao como ponto inicial.

Execucao:
- Tela principal foi reposicionada como `Minha rotina`, mantendo o motor do cockpit ja existente.
- Menu e titulo principal agora comunicam rotina de trabalho, nao uma tela tecnica paralela.
- A fila ja consolida tarefas, campanhas, propostas, oportunidades e clientes sem proxima acao como ponto de partida operacional.

### A05 - Campanhas existem, mas sem campanha ativa a tela parece vazia/confusa

Status: P1.

Evidencia:
- Tela abre com 0 clientes no publico atual em varios cenarios.
- Ha muitas etapas e controles antes de o usuario entender qual campanha executar.

Impacto:
- Campanhas estao poderosas, mas pouco guiadas.

Acao:
- Criar modo `Campanha assistida`: escolher objetivo -> publico sugerido -> mensagem -> revisar -> executar.
- Separar `Campanhas salvas` de `Criar campanha`.
- Mostrar exemplos prontos: reativacao 90d, recompra medida, lista externa, sem contato 60d.

### A06 - Pipeline tem estrutura, mas poucos dados reais abertos

Status: Concluido.

Evidencia:
- Pipeline real estava com 0 deals em aberto no teste.
- Motor de oportunidades possui 43.605 oportunidades cacheadas, mas pipeline real nao reflete isso.

Impacto:
- Oportunidades ainda ficam como sugestao, nao como funil vivo.

Acao:
- Criar conversao em lote de oportunidades priorizadas para deals.
- Definir regras automaticas: campanha respondeu -> deal; proposta enviada -> deal; cliente de alto valor sem contato -> deal sugerido.
- Exibir alerta quando houver fila grande e pipeline vazio.

Execucao:
- Tela de oportunidades agora alerta quando ha oportunidades ativas e o pipeline real esta vazio.
- Adicionada selecao rapida das primeiras oportunidades priorizadas.
- Adicionada acao em lote `Criar deals` para converter oportunidades selecionadas em pipeline real.

### A07 - Funcionalidades de gestao demais para o vendedor

Status: Concluido.

Evidencia:
- Vendedor acessa Catalogo, Oportunidades, Campanhas e Orcamentos, mas sem carteira tudo fica vazio.
- Sem uma rotina guiada, as telas parecem independentes.

Impacto:
- Risco de baixa adocao.

Acao:
- Para vendedor, sidebar deve priorizar:
  - Minha rotina.
  - Clientes.
  - Propostas.
  - Campanhas/retornos.
  - Catalogo.
- Ocultar/colapsar telas que sao apenas gerenciais quando nao houver dados.

Execucao:
- Sidebar do vendedor foi reduzida para `Minha rotina`, `Clientes`, `Campanhas`, `Propostas` e `Catalogo`.
- Telas como clientes sem cadastro, tarefas e oportunidades continuam acessiveis por atalhos/contexto, mas deixam de competir como menu principal do vendedor.
- Admin mantem a visao completa de operacao, comercial e gestao.

### A08 - Historico e atividade evoluiram, mas falta painel de produtividade por usuario

Status: P2.

Evidencia:
- Tarefas, campanhas e pipeline agora registram interacoes, mas nao ha uma tela simples de "o que cada vendedor fez hoje".

Impacto:
- Gerente ainda depende de relatorios agregados, nao de uma rotina de gestao diaria.

Acao:
- Criar painel `Atividade do dia`: contatos registrados, tarefas concluidas, propostas criadas/enviadas, campanhas tratadas, pipeline movido.

### A09 - Warning de keys duplicadas na lista de clientes

Status: Concluido.

Evidencia:
- Revalidacao da Ficha 360 mostrou warning React: `Encountered two children with the same key`.

Impacto:
- Pode causar duplicacao visual, perda de estado de linha e comportamento instavel em listas.

Acao:
- Auditar listas renderizadas na tela de Clientes/Ficha.
- Garantir keys compostas quando houver risco de IDs repetidos ou dados agregados.

Execucao:
- Corrigida a fila do Cockpit para deduplicar tarefas e acoes antes de renderizar.
- Revalidacao local do admin deixou de apontar duplicidade de tarefas na fila principal.

## Queue de execucao recomendada

### Sprint A - Confiabilidade e rotina basica

1. P0 - Corrigir erro 500 de servicos na Ficha 360.
2. P0 - Corrigir/solidificar CTA `Nova proposta` a partir de cliente.
3. P0 - Criar alerta de vendedor sem carteira e acao admin de distribuicao.
4. P1 - Criar tela `Minha rotina` para vendedor.

### Sprint B - Limpeza de produto

5. P1 - Reorganizar sidebar por perfil.
6. P1 - Transformar campanhas em fluxo assistido.
7. P1 - Criar alertas quando pipeline real estiver vazio e fila de oportunidades estiver alta.
8. P1 - Acoes em lote para converter oportunidades em deals.

### Sprint C - Gestao e maturidade CRM

9. P2 - Painel de atividade do dia por vendedor.
10. P2 - Metas e gamificacao simples por vendedor.
11. P2 - Regras de automacao configuraveis por admin.
12. P2 - Relatorio de qualidade de uso: clientes sem proxima acao, tarefas vencidas, propostas sem follow-up.

## Criterio para considerar a proxima rodada pronta

- Vendedor com carteira consegue abrir o app e trabalhar sem sair de `Minha rotina`.
- Admin enxerga imediatamente vendedores sem carteira, atrasos e gargalos.
- Ficha 360 carrega mesmo se uma aba de historico falhar.
- Proposta abre sempre a partir de qualquer contexto de cliente.
- Campanha pode ser criada por objetivo sem o usuario entender filtros tecnicos.
