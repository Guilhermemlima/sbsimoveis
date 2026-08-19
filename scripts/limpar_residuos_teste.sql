-- =====================================================================
-- Remove os residuos deixados pelos testes do CRM
-- =====================================================================
-- Sao dois registros que nao tem exclusao pela interface:
--   1. a vistoria criada ao testar a sincronizacao da etapa Vistoria
--   2. o comprador de teste (usuario nao pode ser apagado pela tela,
--      apenas desativado — por isso ele ainda aparece em Clientes)
-- Nenhum dos dois afeta o funcionamento; e so limpeza.
-- =====================================================================

-- 1. Vistoria de teste (imovel ja excluido, sem ambientes preenchidos)
DELETE FROM inspection_media WHERE inspection_id = '553a9da5-64d3-49d5-b87d-ef0c0db5b103';
DELETE FROM inspections      WHERE id            = '553a9da5-64d3-49d5-b87d-ef0c0db5b103';

-- 2. Comprador de teste "[T2] Comprador Completo"
DELETE FROM client_documents WHERE client_id = '8aca3e65-ce92-40cf-b577-7b4854f4df82';
DELETE FROM clients          WHERE id        = '8aca3e65-ce92-40cf-b577-7b4854f4df82';
DELETE FROM users            WHERE id        = '8aca3e65-ce92-40cf-b577-7b4854f4df82';
