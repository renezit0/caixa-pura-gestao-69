-- Habilitar RLS nas tabelas que têm políticas mas estão sem RLS
ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacao_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para essas tabelas (permitir tudo já que não usamos Supabase Auth)
CREATE POLICY "Allow all operations on caixa" ON caixa
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on itens_venda" ON itens_venda
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on movimentacao_estoque" ON movimentacao_estoque
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vendas" ON vendas
  FOR ALL USING (true) WITH CHECK (true);

-- Inserir um registro padrão na tabela empresa se não existir
INSERT INTO empresa (nome)
SELECT 'seeStore'
WHERE NOT EXISTS (SELECT 1 FROM empresa);