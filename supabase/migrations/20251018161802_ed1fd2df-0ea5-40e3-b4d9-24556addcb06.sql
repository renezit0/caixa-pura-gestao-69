-- Resetar todas as vendas e produtos
-- Deletar itens de venda primeiro (dependem de vendas)
DELETE FROM itens_venda;

-- Deletar vendas
DELETE FROM vendas;

-- Deletar movimentações de estoque (dependem de produtos)
DELETE FROM movimentacao_estoque;

-- Deletar produtos
DELETE FROM produtos;

-- Resetar a sequência de número de venda para começar do 1 novamente
ALTER SEQUENCE vendas_numero_venda_seq RESTART WITH 1;