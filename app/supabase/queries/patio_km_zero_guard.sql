-- Proibe novos cadastros de servico com KM zerado.
-- KM nulo continua permitido para representar "KM NAO LANCADO".

alter table public.patio_atendimentos
  drop constraint if exists patio_atendimentos_quilometragem_positive_or_null;

alter table public.patio_atendimentos
  add constraint patio_atendimentos_quilometragem_positive_or_null
  check (quilometragem is null or quilometragem > 0)
  not valid;

alter table public.patio_atendimento_itens
  drop constraint if exists patio_atendimento_itens_quilometragem_positive_or_null;

alter table public.patio_atendimento_itens
  add constraint patio_atendimento_itens_quilometragem_positive_or_null
  check (quilometragem is null or quilometragem > 0)
  not valid;
