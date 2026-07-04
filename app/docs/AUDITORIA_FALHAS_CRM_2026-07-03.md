# Auditoria de falhas do CRM - 2026-07-03

## Resumo executivo

O sistema tem valor real, mas ainda carrega tres riscos grandes:

1. **UX operacional confusa**: muitas telas e indicadores competem com a rotina do vendedor.
2. **Dívida técnica concentrada**: `App.tsx` virou um monolito de quase 1 MB.
3. **Segurança e manutenção**: lint falha, dependencias vulneraveis e varias permissoes SQL expostas a `anon` precisam revisao.

Build web passa, TypeScript mobile passa, mas isso nao significa que o sistema esteja pronto para uso diario sem ajustes. O maior risco de abandono hoje e o vendedor nao entender a proxima acao.

## Checagens executadas

Data: 2026-07-03

Comandos:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd audit --omit=dev
npx.cmd tsc --noEmit
```

Resultados:

- Web build: passou.
- Web lint: falhou com 22 erros e 7 warnings depois das correcoes pequenas desta rodada.
- Web audit: 2 vulnerabilidades, sendo 1 alta em `xlsx` sem fix disponivel.
- Mobile TypeScript: passou.
- Mobile audit: 26 vulnerabilidades, incluindo 1 critica.
- Segredos locais: `.env`, `.env.local` e cofre DPAPI estao ignorados pelo Git.

## Correcoes aplicadas nesta rodada

- Campanhas recebeu o bloco **Trabalho de agora** tambem no desktop, com proximo contato sugerido, contadores simples e atalhos para Publico, Texto, Fila e Retornos.
- A escolha de frente comercial Pneu/Service voltou a aparecer na etapa de Publico; antes estava escondida por uma regra CSS ampla demais.
- Campanhas salvas/modelos foram movidos para uma gaveta opcional para reduzir ruido na operacao diaria.
- Upload/preview de Excel recebeu limites de tamanho, abas e linhas para reduzir risco do pacote `xlsx`.
- Importacao de referencia recebeu limite de tamanho/linhas antes de processar arquivos grandes.
- Foi criado `supabase/queries/security_hardening_anon_revoke.sql` para endurecer permissoes anon, ainda nao aplicado em producao.
- Foram corrigidos erros pequenos de lint: escapes regex, variavel de imagem copiada e calculo repetido de `Date.now()` no follow-up de proposta.

## Falhas criticas

### C01 - Chaves sensiveis precisam ser rotacionadas

Severidade: critica

Foi criada protecao local com DPAPI, mas chaves sensiveis ja circularam fora de um cofre formal durante a configuracao do projeto.

Risco:

- uso indevido de service role;
- acesso direto ao banco;
- vazamento de dados de clientes;
- alteracao de dados sem auditoria.

Acao recomendada:

1. Rotacionar a senha do banco.
2. Rotacionar service role.
3. Rotacionar anon key, se o projeto permitir sem quebrar clientes.
4. Atualizar o cofre DPAPI.
5. Atualizar variaveis de ambiente de deploy.
6. Nunca colar service role em chat, commit, issue ou planilha.

Status atual:

- DPAPI local existe.
- Arquivo `app/secrets/*.dpapi.json` esta ignorado.
- Ainda falta rotacao formal.

### C02 - Muitas funcoes e views SQL concedidas a `anon`

Severidade: critica

Foram encontrados muitos `grant execute` e `grant select` para `anon`, especialmente em funcoes mobile e Patio.

Exemplos de grupos afetados:

- `mobile_client_create`;
- `mobile_vehicle_create`;
- `mobile_services_register`;
- `mobile_assign`;
- `mobile_finalize_box`;
- views de Patio;
- buscas por placa/clientes.

Risco:

- usuario sem autenticacao pode executar RPCs se tiver anon key;
- operacoes de Patio podem ser chamadas fora do app;
- dados operacionais podem ficar expostos;
- RLS pode ser contornado se a funcao estiver com privilegios amplos.

Acao recomendada:

1. Listar todas as funcoes com `to anon`.
2. Separar leitura publica real de operacao autenticada.
3. Trocar operacoes de escrita para `authenticated`.
4. Validar `auth.uid()` dentro das funcoes.
5. Criar testes SQL de permissao.
6. Remover `anon` de funcoes de escrita.

Status atual:

- SQL de endurecimento preparado em `supabase/queries/security_hardening_anon_revoke.sql`.
- Ainda falta validar em ambiente controlado antes de aplicar, porque Patio/mobile podem depender de permissoes antigas.

### C03 - Mobile tem vulnerabilidade critica em dependencias

Severidade: critica

`npm audit --omit=dev` em `app-mobile` encontrou 26 vulnerabilidades, incluindo `shell-quote` critica.

Risco:

- cadeia Expo/React Native com dependencias vulneraveis;
- risco maior em build, tooling e ambiente de desenvolvimento;
- possivel necessidade de upgrade coordenado do Expo.

Acao recomendada:

1. Rodar `npm audit fix` em branch separada.
2. Testar app mobile.
3. Avaliar upgrade Expo com cuidado.
4. Priorizar `axios`, `form-data`, `shell-quote`, `undici`, `ws`, `tar`.

## Falhas altas

### A01 - Web usa `xlsx` com vulnerabilidade alta sem fix disponivel

Severidade: alta

`npm audit` indicou vulnerabilidades em `xlsx`:

- Prototype Pollution;
- ReDoS.

Nao ha fix disponivel para a versao usada.

Risco:

- arquivos Excel maliciosos podem travar ou afetar processamento;
- importacao de arquivos externos fica sensivel.

Acao recomendada:

1. Nao aceitar planilhas de origem desconhecida.
2. Limitar tamanho de arquivo e quantidade de linhas.
3. Rodar importacao pesada em ambiente isolado.
4. Avaliar troca futura para biblioteca mantida.
5. Validar planilhas antes de parsear.

Status atual:

- `workbookPreview.ts` agora limita arquivo, quantidade de abas e linhas por aba antes de processar.
- `referenceImportPreview.ts` agora bloqueia arquivo grande e excesso de linhas na importacao de referencia.
- Ainda falta avaliar troca futura de biblioteca, porque `xlsx` continua sem fix disponivel.

### A02 - ESLint falha com 22 erros

Severidade: alta

Principais grupos:

- `setState` sincrono dentro de `useEffect`;
- warnings de dependencias ausentes em hooks.

Risco:

- renders em cascata;
- comportamento instavel;
- performance ruim;
- futuras mudancas quebram fluxo sem aviso;
- CI nao consegue usar lint como gate.

Acao recomendada:

1. Revisar effects com setState imediato.
2. Depois atacar dependencies de hooks.
3. So entao tornar lint obrigatorio no CI.

Status atual:

- Erros de regex, `copiedImage` e `Date.now()` foram corrigidos.
- Restam 22 erros de `setState`/carregamento sincronizado em effects e 7 warnings de dependencies.

### A03 - `App.tsx` virou monolito de 931 KB

Severidade: alta

`App.tsx` e o maior arquivo do projeto, com quase todo o produto dentro.

Risco:

- dificil encontrar bugs;
- dificil revisar PR;
- alto risco de quebrar uma tela ao mexer em outra;
- lentidao de lint/transpilacao;
- componentes compartilham estado demais;
- UX vira acumulacao de blocos, nao fluxo.

Acao recomendada:

Extrair por dominio:

1. `features/crm/Hoje.tsx`
2. `features/crm/Clientes.tsx`
3. `features/crm/Cliente360.tsx`
4. `features/crm/Campanhas.tsx`
5. `features/crm/Propostas.tsx`
6. `features/gestao/Relatorios.tsx`
7. `features/patio/*`
8. hooks de carregamento por dominio.

### A04 - A experiencia ainda depende de diagnostico demais

Severidade: alta

Mesmo com a simplificacao do menu, ainda ha telas como Relatorios, Campanhas e Cliente360 com muitos blocos.

Risco:

- vendedor fica lendo em vez de agir;
- gestor perde tempo interpretando painel;
- usuarios diferentes veem informacao que nao precisam;
- a ferramenta parece complexa demais.

Acao recomendada:

Regra de produto:

- tela de vendedor deve ter uma acao principal;
- maximo tres acoes por card;
- diagnostico avancado deve ficar recolhido;
- relatorio deve gerar tarefa, nao despejar tabela.

## Falhas medias

### M01 - Relatorios ainda estao misturados

Severidade: media

Relatorios incluem forecast, gargalos, alertas, disciplina, metas, ranking, sequencias, automacoes, qualidade, campanhas, produtividade, funil, perdas, atividades, plano gerencial, importacoes, carteira, rankings.

Risco:

- tela de gestao fica pesada;
- dificil saber o que olhar na reuniao semanal;
- dados bons perdem forca por excesso.

Acao recomendada:

Separar em tres abas:

1. **Reuniao semanal**
   - forecast;
   - propostas paradas;
   - tarefas vencidas;
   - top alertas.

2. **Equipe**
   - disciplina comercial;
   - metas;
   - ranking;
   - carteira.

3. **Diagnostico**
   - importacoes;
   - qualidade de uso;
   - campanhas;
   - dados tecnicos.

### M02 - Campanhas ainda tem muitos estados para o vendedor

Severidade: media

Campanhas misturam:

- publico;
- texto;
- salvar;
- envio;
- retorno;
- filtros avancados;
- campanhas salvas;
- resultados.

Risco:

- vendedor avanca sem salvar;
- campanha fica sem referencia;
- retorno nao vira acao;
- lista parece ferramenta de marketing, nao rotina comercial.

Acao recomendada:

Transformar em fluxo fixo:

1. Rascunho.
2. Fila para enviar.
3. Aguardando resposta.
4. Retornos.
5. Encerrados.

Status atual:

- A tela ganhou o console **Trabalho de agora**, com proximo contato, pendentes, aguardando e retornos.
- A separacao Pneu/Service ficou visivel na etapa de Publico.
- Campanhas salvas/modelos viraram apoio recolhido.
- Ainda falta simplificar a linha da tabela de execucao, que possui muitas acoes por cliente.

### M03 - Cliente360 e poderosa, mas pesada

Severidade: media

A ficha contem historico, veiculos, vendas, servicos, propostas, campanhas, tarefas, timeline e atendimento.

Risco:

- boa para consulta, pesada para ligacao;
- vendedor pode perder foco;
- informacao critica fica misturada com historico completo.

Acao recomendada:

Criar topo fixo "Na mao para o contato":

- contato recomendado;
- ultimo produto/servico;
- proposta aberta;
- proxima acao;
- botoes: WhatsApp, Nova proposta, Registrar contato.

O resto deve ficar em abas recolhidas.

### M04 - Mobile tem muitos `any`

Severidade: media

Foram encontrados varios `any` em telas mobile e API client.

Risco:

- erros de contrato com RPC/API aparecem so em runtime;
- app mobile pode quebrar com mudanca pequena no backend.

Acao recomendada:

1. Criar tipos por endpoint mobile.
2. Tipar respostas do Supabase/RPC.
3. Remover `any` das telas principais.

### M05 - Logs e scripts precisam de padrao de seguranca

Severidade: media

Scripts imprimem bastante informacao no console. Isso e util localmente, mas pode vazar dados se rodar em ambiente compartilhado.

Acao recomendada:

1. Nunca logar tokens.
2. Mascarar telefone/CPF/CNPJ em logs longos.
3. Separar modo `--verbose`.
4. Salvar relatorios sensiveis em pasta ignorada.

## Falhas baixas

### B01 - README esta desatualizado

Severidade: baixa

O README ainda descreve o app como MVP com dashboard comercial e varias telas antigas.

Acao recomendada:

Atualizar README apontando para:

- `docs/MANUAL_USO_CRM.md`;
- arquitetura CRM + Patio;
- comandos reais de validacao;
- politica de segredos.

### B02 - Nomenclatura ainda mistura proposta/orcamento em pontos internos

Severidade: baixa

O usuario ve "Propostas", mas o codigo e alguns textos ainda usam orcamento.

Acao recomendada:

- manter "orcamento" no banco/codigo se for necessario;
- usar "Proposta" em toda UI.

## Achados positivos

- Web build passa.
- Mobile TypeScript passa.
- `.env` do mobile esta ignorado.
- `.env.local` do web esta ignorado.
- DPAPI local foi criado para secrets.
- A direcao de produto esta correta: `Hoje` precisa ser fila de acao.
- O Patio operacional deve ser preservado e nao misturado com CRM pesado.

## Ordem recomendada de correcao

### Semana 1 - Evitar abandono

1. Finalizar simplificacao de Hoje.
2. Simplificar Clientes/Ficha para contato.
3. Simplificar Campanhas em etapas.
4. Atualizar manual e treinar equipe.

### Semana 2 - Segurança e confiabilidade

1. Rotacionar chaves.
2. Revisar `anon` em SQL/RPC.
3. Corrigir vulnerabilidades possiveis com `npm audit fix`.
4. Definir politica para `xlsx`.

### Semana 3 - Saude tecnica

1. Corrigir lint mais simples.
2. Extrair `App.tsx` por dominios.
3. Criar smoke tests dos fluxos principais:
   - login;
   - Hoje;
   - abrir ficha;
   - criar proposta;
   - campanha;
   - registrar resultado.

## Criterio de pronto para uso comercial

O CRM so deve ser considerado pronto quando:

- vendedor sabe o que fazer em menos de 30 segundos na tela Hoje;
- toda proposta aberta tem follow-up;
- todo contato de campanha tem status;
- gestor consegue ver excecoes sem abrir 10 paineis;
- lint passa ou tem lista formal de excecoes;
- secrets foram rotacionados;
- funcoes anon foram revisadas;
- manual foi validado com uma pessoa real usando o sistema.
