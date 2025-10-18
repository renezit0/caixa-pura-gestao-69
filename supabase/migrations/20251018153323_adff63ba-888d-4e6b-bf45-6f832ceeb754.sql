-- Habilitar RLS nas tabelas restantes que não têm RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela clientes
CREATE POLICY "Allow all operations on clientes" ON clientes
  FOR ALL USING (true) WITH CHECK (true);