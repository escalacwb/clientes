-- Hardening de permissoes anonimas - 2026-07-03
--
-- Objetivo:
-- - remover acesso anonimo de funcoes que leem dados operacionais sensiveis ou gravam no Patio/CRM;
-- - manter execucao para authenticated e service_role;
-- - reduzir risco caso a anon key seja usada fora do app.
--
-- Aplique em janela controlada e valide web + mobile apos executar.

begin;

-- Mobile Patio/CRM: leitura operacional e escrita devem exigir usuario autenticado.
revoke execute on function public.mobile_clients_search(text) from anon;
revoke execute on function public.mobile_client_details(bigint) from anon;
revoke execute on function public.mobile_vehicle_by_plate(text) from anon;
revoke execute on function public.mobile_client_create(text, text) from anon;
revoke execute on function public.mobile_client_update(bigint, text, text) from anon;
revoke execute on function public.mobile_vehicle_create(text, text, text, integer, text, text, bigint) from anon;
revoke execute on function public.mobile_vehicle_update(bigint, text, integer, text, text) from anon;
revoke execute on function public.mobile_vehicle_company_update(bigint, text, bigint) from anon;
revoke execute on function public.mobile_services_register(bigint, integer, text, jsonb, bigint) from anon;
revoke execute on function public.mobile_pending_vehicles() from anon;
revoke execute on function public.mobile_pending_areas(bigint) from anon;
revoke execute on function public.mobile_funcionarios() from anon;
revoke execute on function public.mobile_boxes_available() from anon;
revoke execute on function public.mobile_assign(bigint, text, integer, bigint, bigint) from anon;
revoke execute on function public.mobile_queues() from anon;
revoke execute on function public.mobile_boxes_active() from anon;
revoke execute on function public.mobile_box_details(integer) from anon;
revoke execute on function public.mobile_add_box_service(integer, text, integer) from anon;
revoke execute on function public.mobile_unassign_box(integer) from anon;
revoke execute on function public.mobile_finalize_box(integer, text, jsonb, bigint) from anon;
revoke execute on function public.mobile_completed_services(date, date) from anon;
revoke execute on function public.mobile_update_tipo_atendimento(text, text, text) from anon;
revoke execute on function public.mobile_revert_visit(bigint, integer) from anon;
revoke execute on function public.mobile_term_data(bigint) from anon;

grant execute on function public.mobile_clients_search(text) to authenticated, service_role;
grant execute on function public.mobile_client_details(bigint) to authenticated, service_role;
grant execute on function public.mobile_vehicle_by_plate(text) to authenticated, service_role;
grant execute on function public.mobile_client_create(text, text) to authenticated, service_role;
grant execute on function public.mobile_client_update(bigint, text, text) to authenticated, service_role;
grant execute on function public.mobile_vehicle_create(text, text, text, integer, text, text, bigint) to authenticated, service_role;
grant execute on function public.mobile_vehicle_update(bigint, text, integer, text, text) to authenticated, service_role;
grant execute on function public.mobile_vehicle_company_update(bigint, text, bigint) to authenticated, service_role;
grant execute on function public.mobile_services_register(bigint, integer, text, jsonb, bigint) to authenticated, service_role;
grant execute on function public.mobile_pending_vehicles() to authenticated, service_role;
grant execute on function public.mobile_pending_areas(bigint) to authenticated, service_role;
grant execute on function public.mobile_funcionarios() to authenticated, service_role;
grant execute on function public.mobile_boxes_available() to authenticated, service_role;
grant execute on function public.mobile_assign(bigint, text, integer, bigint, bigint) to authenticated, service_role;
grant execute on function public.mobile_queues() to authenticated, service_role;
grant execute on function public.mobile_boxes_active() to authenticated, service_role;
grant execute on function public.mobile_box_details(integer) to authenticated, service_role;
grant execute on function public.mobile_add_box_service(integer, text, integer) to authenticated, service_role;
grant execute on function public.mobile_unassign_box(integer) to authenticated, service_role;
grant execute on function public.mobile_finalize_box(integer, text, jsonb, bigint) to authenticated, service_role;
grant execute on function public.mobile_completed_services(date, date) to authenticated, service_role;
grant execute on function public.mobile_update_tipo_atendimento(text, text, text) to authenticated, service_role;
grant execute on function public.mobile_revert_visit(bigint, integer) to authenticated, service_role;
grant execute on function public.mobile_term_data(bigint) to authenticated, service_role;

-- Patio web: funcoes operacionais tambem devem exigir usuario autenticado.
revoke execute on function public.buscar_patio_veiculos(text, integer) from anon;
revoke execute on function public.corrigir_km_atendimento_patio_crm(bigint, integer) from anon;
revoke execute on function public.registrar_entrada_patio_crm(bigint, integer, text, text, jsonb, text) from anon;
revoke execute on function public.alocar_servicos_patio_crm(bigint, text, integer, bigint) from anon;
revoke execute on function public.adicionar_servico_box_patio_crm(bigint, text, text, integer) from anon;
revoke execute on function public.retirar_box_patio_crm(bigint) from anon;
revoke execute on function public.finalizar_box_patio_crm(bigint, jsonb, text) from anon;
revoke execute on function public.reverter_visita_patio_crm(bigint) from anon;
revoke execute on function public.listar_patio_revisao_proativa(numeric, integer, text, uuid, integer, integer) from anon;
revoke execute on function public.listar_patio_revisao_resultados(text, integer, integer) from anon;
revoke execute on function public.resumo_patio_revisao_efetividade(integer) from anon;

grant execute on function public.buscar_patio_veiculos(text, integer) to authenticated, service_role;
grant execute on function public.corrigir_km_atendimento_patio_crm(bigint, integer) to authenticated, service_role;
grant execute on function public.registrar_entrada_patio_crm(bigint, integer, text, text, jsonb, text) to authenticated, service_role;
grant execute on function public.alocar_servicos_patio_crm(bigint, text, integer, bigint) to authenticated, service_role;
grant execute on function public.adicionar_servico_box_patio_crm(bigint, text, text, integer) to authenticated, service_role;
grant execute on function public.retirar_box_patio_crm(bigint) to authenticated, service_role;
grant execute on function public.finalizar_box_patio_crm(bigint, jsonb, text) to authenticated, service_role;
grant execute on function public.reverter_visita_patio_crm(bigint) to authenticated, service_role;
grant execute on function public.listar_patio_revisao_proativa(numeric, integer, text, uuid, integer, integer) to authenticated, service_role;
grant execute on function public.listar_patio_revisao_resultados(text, integer, integer) to authenticated, service_role;
grant execute on function public.resumo_patio_revisao_efetividade(integer) to authenticated, service_role;

-- Views/tabelas operacionais com dados de clientes, placas, funcionarios e boxes.
revoke select on public.vw_cliente_contatos_recomendados from anon;
revoke select on public.vw_patio_crm_oportunidades from anon;
revoke select on public.vw_patio_feedback_pendente from anon;
revoke select on public.vw_patio_revisao_proativa from anon;
revoke select on public.vw_patio_veiculos_busca from anon;
revoke select on public.vw_patio_fila_itens from anon;
revoke select on public.vw_patio_boxes_ativos from anon;
revoke select on public.vw_patio_concluidos from anon;
revoke select on public.patio_funcionarios_snapshot from anon;
revoke select on public.patio_boxes_snapshot from anon;
revoke select on public.patio_catalogo_servicos_snapshot from anon;
revoke select on public.vw_patio_catalogo_servicos from anon;
revoke select on public.vw_patio_alocacao_veiculos from anon;
revoke select on public.vw_patio_areas_pendentes from anon;
revoke select on public.vw_patio_boxes_painel from anon;
revoke select on public.vw_patio_box_servicos from anon;
revoke select on public.vw_patio_fila_painel from anon;
revoke select on public.vw_patio_relatorio_servicos from anon;
revoke select on public.vw_patio_revisao_resultados from anon;

grant select on public.vw_cliente_contatos_recomendados to authenticated, service_role;
grant select on public.vw_patio_crm_oportunidades to authenticated, service_role;
grant select on public.vw_patio_feedback_pendente to authenticated, service_role;
grant select on public.vw_patio_revisao_proativa to authenticated, service_role;
grant select on public.vw_patio_veiculos_busca to authenticated, service_role;
grant select on public.vw_patio_fila_itens to authenticated, service_role;
grant select on public.vw_patio_boxes_ativos to authenticated, service_role;
grant select on public.vw_patio_concluidos to authenticated, service_role;
grant select on public.patio_funcionarios_snapshot to authenticated, service_role;
grant select on public.patio_boxes_snapshot to authenticated, service_role;
grant select on public.patio_catalogo_servicos_snapshot to authenticated, service_role;
grant select on public.vw_patio_catalogo_servicos to authenticated, service_role;
grant select on public.vw_patio_alocacao_veiculos to authenticated, service_role;
grant select on public.vw_patio_areas_pendentes to authenticated, service_role;
grant select on public.vw_patio_boxes_painel to authenticated, service_role;
grant select on public.vw_patio_box_servicos to authenticated, service_role;
grant select on public.vw_patio_fila_painel to authenticated, service_role;
grant select on public.vw_patio_relatorio_servicos to authenticated, service_role;
grant select on public.vw_patio_revisao_resultados to authenticated, service_role;

commit;
