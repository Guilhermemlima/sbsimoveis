-- Remove o imovel de teste usado para conferir a numeracao automatica
-- e zera de novo a sequencia, para que o primeiro imovel real da SBS
-- receba o codigo CS-000001.
-- Opcional: sem isso, o primeiro imovel real sai como CS-000002.

DELETE FROM properties WHERE title = '[TESTE NUMERACAO] Casa';
DELETE FROM property_code_sequences;
