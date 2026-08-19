-- Remove o cenario criado para testar a protecao de exclusao de clientes.
-- Contratos nao tem exclusao pela tela (por auditoria), entao a limpeza
-- do contrato cancelado e do imovel/pessoas ligados a ele e por aqui.

DELETE FROM lease_contract_owners  WHERE lease_contract_id IN (SELECT id FROM lease_contracts WHERE notes = '[TESTE] remover depois');
DELETE FROM lease_contract_tenants WHERE lease_contract_id IN (SELECT id FROM lease_contracts WHERE notes = '[TESTE] remover depois');
DELETE FROM financial_transactions WHERE lease_contract_id IN (SELECT id FROM lease_contracts WHERE notes = '[TESTE] remover depois');
DELETE FROM lease_contracts        WHERE notes = '[TESTE] remover depois';

DELETE FROM property_owners WHERE name = '[DEL] Prop Com Contrato';
DELETE FROM tenants         WHERE name = '[DEL] Inq Com Contrato';
DELETE FROM properties      WHERE title = '[DEL] Imovel Contrato';
