# Auditoria da fusao Controle de Patio -> CRM

Objetivo: comparar as paginas operacionais do app original `controle-patio/pages` com o modo Patio/CRM atual em React, listando botoes e funcoes que precisam ser iguais ou equivalentes.

## Cadastro rapido de servicos

Original: `cadastro_servico.py`
- Verificar Placa no Sistema.
- Alterar Veiculo dentro do fluxo.
- Alterar Empresa/Responsavel dentro do fluxo.
- Salvar Dados do Veiculo.
- Buscar/selecionar/criar empresa e salvar vinculacao.
- Editar responsavel da frota.
- Diagnostico por eixos, pneus e comportamento geral.
- Adicionar servico por area: Borracharia, Alinhamento, Mecanica.
- Remover servico da lista.
- Cadastrar e Notificar.
- Se placa nao encontrada: Buscar na API, Aceitar/Cancelar dados, cadastrar novo veiculo e continuar.
- Limpar e iniciar nova busca.

Atual:
- Busca por placa/cliente/motorista.
- Registra entrada, diagnostico, servicos por area, remove item e envia para fila.
- Atualiza motorista/contato no registro.

Pendencias:
- Adicionar edicao de veiculo no proprio fluxo.
- Adicionar edicao/vinculacao de empresa/responsavel no proprio fluxo.
- Adicionar fluxo de placa inexistente/cadastro novo veiculo.
- Revisar se "Cadastrar e Notificar" precisa disparar a mesma notificacao do original.

## Alocar servicos

Original: `alocar_servicos.py`
- Selecionar veiculo.
- Selecionar area pendente.
- Selecionar box livre.
- Selecionar funcionario.
- Mostrar KM do cadastro ou erro se nao encontrada.
- Botao Alocar Servicos e Iniciar Execucao.

Atual:
- Equivalente funcional.

Pendencias:
- Validar se boxes/funcionarios filtram exatamente `id > 0` e livres como no original.

## Fila de servico

Original: `filas_servico.py`
- Painel TV com auto-refresh 30s.
- Secao EM ATENDIMENTO.
- Secao FILA DE ESPERA.
- Cards escuros, placa grande, ordem na fila, servicos com quantidade.

Atual:
- Equivalente visual/funcional no React, com busca/filtro extra e detalhe tecnico.

Pendencias:
- Validar auto-refresh real da tela.

## Visao dos boxes

Original: `visao_boxes.py`
- Sincronizar Todos os Boxes.
- Mostrar box livre.
- Mostrar placa, empresa, motorista/contato, funcionario, KM, modelo, observacoes.
- Retirar do Box.
- Editar quantidade executada de cada servico.
- Mostrar observacao cadastro e execucao.
- Adicionar Servico Extra.
- Observacoes Finais da Execucao.
- Finalizar Box.

Atual:
- Mostra boxes, livre/ocupado, dados do veiculo, servicos, retirar, detalhar, editar qtd/obs execucao, adicionar extra, observacao final, finalizar.

Pendencias:
- Adicionar botao "Sincronizar Todos os Boxes".
- Garantir que observacoes de cadastro aparecam fora/visiveis como no original.

## Servicos concluidos

Original: `servicos_concluidos.py`
- Filtro por periodo de conclusao.
- Agrupa visitas por veiculo + quilometragem.
- Gerar Termo.
- Reverter para admin.
- Mostra observacoes da visita.
- Tabela de servicos realizados.
- Permite editar Tipo de Atendimento entre Normal/Retorno.

Atual:
- Lista paginada com busca, gerar termo, reverter, feedback.

Pendencias:
- Adicionar filtro por periodo.
- Mostrar servicos da visita no card/detalhe.
- Permitir editar Tipo de Atendimento.
- Agrupar por visita como original.

## Dados de clientes

Original: `dados_clientes.py`
- Busca por nome, fantasia, ID ou codigo antigo.
- Selecionar cliente encontrado.
- Alterar Dados do Cliente.
- Ver Veiculos.
- Alterar Veiculo.
- Ver Historico por veiculo.
- Editar dados do veiculo.
- Historico agrupado por visita.

Atual:
- Busca por cliente/placa/motorista, escolhe veiculo, edita cliente/contato, edita veiculo/motorista/media e mostra historico rapido.

Pendencias:
- Adicionar modo de selecao por cliente com lista de veiculos, como no original.
- Mostrar ID/codigo antigo/fantasia quando disponivel.
- Expandir historico agrupado por visita.

## Feedback pos-servico

Original: `feedback_servicos.py`
- Atualizar Dados.
- Lista feedbacks do periodo.
- Enviar WhatsApp via `wa.me/55...`.
- Contato invalido quando sem telefone.
- Feedback Realizado.
- Mensagem detalhada com perguntas de qualidade.

Atual:
- Lista pendentes, abre `wa.me/55...`, marca feedback feito, cria retorno comercial.

Pendencias:
- Adicionar botao Atualizar Dados.
- Trazer servicos executados na mensagem/lista sem pesar a fila.

## Revisao proativa

Original: `revisao_proativa.py`
- Atualizar Dados.
- Alterar Empresa.
- Alterar Veiculo.
- Alterar Responsavel.
- Modo de busca por Quilometragem ou Tempo.
- Ajustar Media.
- Falar com Motorista via `wa.me`.
- Falar com Gestor via `wa.me`.
- Contato Feito.

Atual:
- Modo KM/Tempo, `wa.me`, marcar contato feito, criar oportunidade, ficha.

Pendencias:
- Adicionar Atualizar Dados.
- Separar Falar com Motorista e Falar com Gestor.
- Adicionar Ajustar Media por item.
- Adicionar Alt. Veiculo e Alt. Empresa.

## Analise de pneus

Original: `analise_pneus.py`
- Buscar dados da placa.
- Informar motorista/gestor, empresa, telefone, email, placa.
- Observacao.
- Adicionar eixo dianteiro/traseiro.
- Remover ultimo eixo.
- Upload de fotos por posicao.
- Enviar para Analise.
- Nova Analise.
- Baixar PDF desabilitado.
- WhatsApp do laudo via `wa.me`.

Atual:
- Upload simples, placa/cliente/obs e analise por Edge Function.

Pendencias:
- Copiar estrutura por eixos e posicoes de fotos.
- Buscar dados da placa.
- Separar campos motorista/empresa/telefone/email.

## Exportar contatos

Original: `exportar_contatos.py`
- Forcar re-exportacao de todos.
- Gerar CSV.
- Download CSV.
- Confirmar e marcar contatos como exportados.

Atual:
- Carrega contatos, gera CSV e baixa.

Pendencias:
- Adicionar re-exportacao total.
- Adicionar confirmacao/marcacao de exportados.
