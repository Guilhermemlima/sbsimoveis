-- =====================================================================
-- LIMPEZA DE DADOS DE TESTE — PREPARACAO PARA USO REAL
-- =====================================================================
-- ATENCAO: este script APAGA DEFINITIVAMENTE todos os dados operacionais.
-- Nao ha como desfazer depois de executado.
--
-- O QUE E MANTIDO:
--   Apenas 4 logins (admin, Guilherme corretor, Gabriel inquilino,
--     Guilherme cliente) com suas permissoes
--   app_settings         -> configuracoes do site
--   financial_categories -> plano de contas (o sistema depende delas)
--   amendment_templates  -> modelos de aditivo
--
-- O QUE E APAGADO: todo o resto (imoveis, contratos, financeiro, leads,
--   vendas, vistorias, manutencao, juridico, assinaturas, auditoria) e
--   os 11 usuarios de teste (corretores ficticios, clientes @example.com
--   e o usuario juridico de teste).
-- =====================================================================

BEGIN;

-- --- Assinatura digital ---------------------------------------------
DELETE FROM signature_request_signers;
DELETE FROM signature_requests;

-- --- Juridico --------------------------------------------------------
DELETE FROM legal_case_status_history;
DELETE FROM legal_case_documents;
DELETE FROM legal_cases;

-- --- Aditivos (mantem amendment_templates, que sao modelos) ----------
DELETE FROM lease_amendments;

-- --- Manutencao ------------------------------------------------------
DELETE FROM maintenance_media;
DELETE FROM maintenance_owner_deductions;
DELETE FROM maintenance_requests;

-- --- Vistorias -------------------------------------------------------
DELETE FROM inspection_media;
DELETE FROM inspection_items;
DELETE FROM inspection_environments;
DELETE FROM inspections;

-- --- Financeiro (mantem financial_categories) ------------------------
DELETE FROM deposit_deductions;
DELETE FROM owner_payouts;
DELETE FROM financial_transactions;

-- --- Contratos de locacao --------------------------------------------
DELETE FROM lease_contract_tenants;
DELETE FROM lease_contract_owners;
DELETE FROM lease_contracts;

-- --- CRM e vendas ----------------------------------------------------
DELETE FROM proposals;
DELETE FROM lead_status_history;
DELETE FROM lead_interactions;
DELETE FROM leads;
DELETE FROM sales;

-- --- Partes (proprietarios, inquilinos, fiadores) e seus documentos --
DELETE FROM owner_documents;
DELETE FROM tenant_documents;
DELETE FROM guarantor_documents;
DELETE FROM property_owners;
DELETE FROM tenants;
DELETE FROM guarantors;

-- --- Documentos de cliente (o login do cliente permanece) ------------
DELETE FROM client_documents;

-- --- Imoveis (inclui os excluidos por soft delete) -------------------
DELETE FROM favorites;
DELETE FROM property_documents;
DELETE FROM property_images;
DELETE FROM properties;

-- --- Auditoria -------------------------------------------------------
DELETE FROM audit_logs;

-- --- Zera a numeracao automatica de codigo de imovel -----------------
-- Assim o primeiro imovel real volta a ser CS-000001, AP-000001 etc.
DELETE FROM property_code_sequences;

-- --- Usuarios de teste -----------------------------------------------
-- Mantem somente os 4 logins confirmados. Qualquer outro usuario
-- (corretores ficticios @sbsimoveis.com.br, clientes @example.com e o
-- usuario juridico de teste) e removido.
-- As tabelas realtors / clients / realtor_permissions apontam para
-- users com ON DELETE CASCADE, entao somem junto automaticamente.
DELETE FROM users
WHERE email NOT IN (
  'sbsimoveis1990@gmail.com',      -- Administrador SBS (seu acesso ao painel)
  'guilhermemulinarelima@gmail.com', -- Guilherme Mulinari Lima (corretor)
  'gabriel@sbssulbrasil.com.br',   -- Gabriel Mulinari Lima (inquilino)
  'gmlima0000@gmail.com'           -- GUILHERME (cliente)
);

COMMIT;

-- =====================================================================
-- CONFERENCIA: rode depois para confirmar que so sobrou o que devia
-- =====================================================================
-- Esperado: users = 4, financial_categories = 24, app_settings = 1,
-- e todo o resto = 0.
-- SELECT 'users' t, COUNT(*) FROM users
-- UNION ALL SELECT 'financial_categories', COUNT(*) FROM financial_categories
-- UNION ALL SELECT 'app_settings', COUNT(*) FROM app_settings
-- UNION ALL SELECT 'properties', COUNT(*) FROM properties
-- UNION ALL SELECT 'lease_contracts', COUNT(*) FROM lease_contracts
-- UNION ALL SELECT 'financial_transactions', COUNT(*) FROM financial_transactions
-- UNION ALL SELECT 'sales', COUNT(*) FROM sales
-- UNION ALL SELECT 'leads', COUNT(*) FROM leads
-- UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
