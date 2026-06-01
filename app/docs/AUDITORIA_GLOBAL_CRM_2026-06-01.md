# Auditoria global CRM + Patio - 2026-06-01

## Objetivo

Avaliar o app como ferramenta real para uma equipe pequena da Capital Truck: simples o suficiente para nao ser abandonada, mas forte para organizar clientes, patio, reativacao, proposta, feedback e follow-up.

## Referencias estudadas

- Boas praticas de CRM/WhatsApp: follow-up curto, personalizado, com proxima acao clara; cadencias simples e registro de contexto.
- CRMs moveis: acesso rapido a cliente, historico, proposta, tarefa e comunicacao, sem reproduzir todo o desktop.
- Propostas B2B: orcamento deve reduzir interpretacao manual, mostrar blocos, condicoes por bloco, validade e proximo passo.
- Adoção por vendedor: telas devem responder "quem eu atendo agora?", "por que esse cliente apareceu?", "o que devo fazer?" e "o que fica salvo depois?".

Fontes consultadas:
- Kraya AI - WhatsApp CRM best practices, follow-up estruturado e proxima acao.
- Klipy - estrategia de follow-up por WhatsApp, timing e registro em CRM.
- Respond.io - campanhas, broadcasts e CRM para acompanhar jornada.
- TechRadar/Freshsales - CRM mobile com dados do cliente, comunicacao e atualizacao de negocios em campo.
- Salesforce - conceito de mobile quick actions.

## Queue macro de auditoria e evolucao

### P0 - Confianca operacional antes de producao

1. **Mapa de dados e migracao final**
   - Criar checklist de migracao Pátio producao -> banco combinado.
   - Validar contagens: clientes, veiculos, atendimentos, itens por area, boxes, funcionarios.
   - Validar amostras reais por placa e cliente.
   - Garantir que o Supabase antigo do Pátio fique somente leitura ate o corte final.

2. **Erros silenciosos e mensagens globais**
   - Remover alertas genericos que aparecem em muitas telas sem orientar acao.
   - Tratar erro de API por tela com mensagem util.
   - Revisar "Supabase configurado · X clientes totais" para nao parecer diagnostico tecnico ao usuario final.

3. **Permissao e modo por perfil**
   - Vendedor comum deve ver apenas o que usa no dia.
   - Gestao deve ficar oculta ou bloqueada de forma limpa no mobile/vendedor.
   - Pátio deve ser acessivel apenas para quem realmente registra/aloca/finaliza servico.

### P1 - Rotina do vendedor como tela principal

4. **Minha rotina deve ser a fila unica de trabalho**
   - Mostrar cards com motivo claro: "proposta vence hoje", "cliente respondeu campanha", "revisao por KM", "sem contato ha X dias".
   - Juntar duplicidades do mesmo cliente em uma linha, exibindo todos os motivos.
   - Cada item deve ter 3 acoes maximas: abrir WhatsApp, registrar resultado, abrir ficha.

5. **Ficha do cliente como central de atendimento**
   - Reorganizar a ficha para priorizar atendimento, nao cadastro.
   - Topo: resumo comercial, contatos recomendados, ultimo movimento, proxima acao.
   - Abas/secao: historico CRM, historico patio, compras/servicos, propostas, campanhas, tarefas.
   - Mostrar por que o cliente entrou naquela fila quando aberto a partir de rotina/campanha/revisao.

6. **Registro de contato profissional**
   - Transformar "Atendimento agora" em um fluxo guiado:
     - Canal.
     - Resultado.
     - Resumo.
     - Proxima acao/data.
     - Criar proposta/tarefa/oportunidade sem sair dali.
   - Botões devem ser poucos e com linguagem de rotina: "Cliente pediu cotacao", "Agendar retorno", "Sem resposta", "Nao contatar".

### P1 - Propostas/orcamentos

7. **Proposta solta e proposta a partir do cliente**
   - Permitir criar proposta buscando cliente sem depender de ficha.
   - Salvar apenas proposta gerada pelo vendedor, nao rascunho acidental.
   - Historico claro por cliente: aberta, enviada, ganha, perdida, vencida.

8. **Editor de proposta mais pratico**
   - Manter busca do catalogo sem resetar.
   - Blocos com nomes livres e tipos claros: "opcoes", "pacote", "servicos inclusos".
   - Condicoes por bloco logo abaixo do bloco.
   - PDF e WhatsApp com mesma logica comercial, mas formatos proprios.

9. **Follow-up automatico da proposta**
   - Ao enviar por WhatsApp, criar tarefa de retorno.
   - Ao marcar ganho/perdido, fechar tarefas relacionadas.
   - Ao vencer, entrar na rotina do vendedor com motivo claro.

### P1 - Campanhas e reativacao

10. **Campanha como objeto salvo**
    - Botao obvio: salvar campanha.
    - Lista de campanhas ativas/rascunhos/encerradas.
    - Possibilidade de excluir campanha e envios de teste.

11. **Filtro de publico mais intuitivo**
    - Remover cards de objetivo que nao mudam comportamento ou deixar cada objetivo preencher filtros reais.
    - Filtros principais: cidade/UF, origem da base, vendedor, dias sem compra, produto/servico comprado, medida, valor historico, com WhatsApp.
    - Sempre mostrar previa paginada dos clientes filtrados.
    - Explicar "0 clientes" com motivo: filtro sem historico, termo nao encontrado, UF sem compra etc.

12. **Execucao de campanha por WhatsApp**
    - Uma linha por cliente com contato editavel em modal rapido.
    - Status simples: pendente, enviado, respondeu, pediu proposta, ganho, perdido, nao contatar.
    - Reenviar deve ser claro: "Voltar para pendente" ou "Reabrir envio".
    - Ao responder depois de dias, fluxo deve criar interacao e proxima acao sem perder o envio original.

### P1 - Pátio preservado

13. **Entrada de servico**
    - Manter layout e rotina do Pátio original.
    - Selecionar servico deve ser evidente: atalho adiciona direto, item repetido soma quantidade.
    - Registrar entrada deve mostrar exatamente o que vai para a fila.

14. **Fila, alocacao e boxes**
    - Validar se todas as acoes do app antigo existem.
    - Nao alterar organizacao visual de boxes/fila sem necessidade.
    - Verificar reverter, finalizar, adicionar servico extra e termo.

15. **Feedback Pátio**
    - Mensagem deve incluir servicos reais feitos.
    - Registro de resultado deve alimentar CRM e oportunidade quando houver problema ou cotacao.
    - Usar `wa.me` como no app original.

16. **Revisao proativa**
    - Validar KM estimado com dados herdados.
    - Criar fila de medias suspeitas para gestao, sem bloquear uso.
    - Controlar resultado: contato feito, retornou ate 15 dias, nao retornou, ajuste de media.

### P2 - Mobile real

17. **Mobile vendedor**
    - Nao ser apenas desktop espremido.
    - Home com 4 acoes: orcar, campanha, consultar cliente, retorno do dia.
    - Esconder importacao/gestao/patio completo se nao for necessario.
    - Cards grandes, poucos campos, acoes de WhatsApp em um toque.

18. **Mobile Pátio**
    - Se usado por equipe operacional, focar em entrada rapida, fila e box.
    - Nao misturar ferramentas comerciais na operacao.

### P2 - Gestao/admin

19. **Gestao enxuta**
    - Importacoes, equipe, usuarios, KM medio e resultados.
    - Evitar excesso de relatorios que nao geram acao.
    - Painel deve apontar problemas de uso: vendedor sem carteira, proposta sem follow-up, campanha sem retorno tratado.

20. **Auditoria e saneamento**
    - Auditoria para alteracoes sensiveis.
    - Saneamento de contatos, duplicidades e medias de KM absurdas.
    - Importacao diaria com deduplicacao e resumo de qualidade.

## Achados da sessao local

### Desktop admin

- Modos existem e navegam: Pátio, CRM, Gestao.
- Pátio preserva fluxo por etapas: cadastro, dados, alocacao, fila, boxes, concluidos, historico, pneus e contatos.
- CRM exibe as ferramentas principais, mas a ordem ainda parece menu de sistema, nao jornada de venda.
- "Vendedores sem carteira" aparece em muitas telas e rouba foco.
- Topo com atalhos e contadores aparece em todo lugar, mas nem sempre ajuda a tarefa da tela.

### Desktop vendedor

- Vendedor entra na "Minha rotina", melhor ponto de partida.
- Ainda aparece seletor de Pátio/Gestao; Gestao fica sem conteudo util no mobile e pode confundir.
- O fluxo de rotina precisa explicar melhor o motivo de cada cliente na fila.

### Mobile

- Existe uma home mobile com acoes rapidas.
- Ainda mostra seletor de modo completo.
- A lista de clientes mostra "Distribuir carteira", que nao e acao de vendedor no mobile.
- Mobile precisa ser tratado como app de campo: acao rapida, historico e WhatsApp, nao gestao completa.

## Principios para as proximas execucoes

1. Reduzir botoes por tela.
2. Toda fila precisa explicar o motivo do item.
3. Todo contato precisa gerar historico e proxima acao.
4. WhatsApp deve ser o canal pratico, com mensagem editavel e registro facil.
5. Pátio deve continuar parecido com o app original.
6. CRM deve ajudar o vendedor a vender, nao exigir preenchimento burocratico.
7. Gestao deve medir aderencia e gargalos, nao virar painel decorativo.

