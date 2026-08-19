-- Remove a vistoria criada durante o teste da sincronizacao do CRM.
-- O modulo de Vistorias nao tem exclusao pela tela (proposital, para
-- preservar historico), entao a limpeza e por aqui.
-- Confira o id antes de rodar: deve ser a vistoria do imovel de teste,
-- em status "in_progress" e sem ambientes preenchidos.

DELETE FROM inspection_media WHERE inspection_id = '553a9da5-64d3-49d5-b87d-ef0c0db5b103';
DELETE FROM inspections     WHERE id            = '553a9da5-64d3-49d5-b87d-ef0c0db5b103';
