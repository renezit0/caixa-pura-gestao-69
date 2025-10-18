-- Adicionar configuração para permitir estoque negativo
INSERT INTO configuracoes (chave, valor, descricao)
VALUES (
  'estoque_permitir_negativo',
  false,
  'Permite vender produtos mesmo com estoque zerado ou negativo'
)
ON CONFLICT (chave) DO NOTHING;