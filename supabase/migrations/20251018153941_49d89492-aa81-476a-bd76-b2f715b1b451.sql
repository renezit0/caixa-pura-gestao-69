-- Corrigir políticas da tabela empresa
DROP POLICY IF EXISTS "Apenas admins podem atualizar empresa" ON empresa;
DROP POLICY IF EXISTS "Todos podem ver informações da empresa" ON empresa;

CREATE POLICY "Allow all to view empresa" ON empresa
  FOR SELECT USING (true);

CREATE POLICY "Allow all to update empresa" ON empresa
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all to insert empresa" ON empresa
  FOR INSERT WITH CHECK (true);

-- Corrigir políticas da tabela usuarios
DROP POLICY IF EXISTS "Apenas admins podem atualizar usuários" ON usuarios;
DROP POLICY IF EXISTS "Apenas admins podem criar usuários" ON usuarios;
DROP POLICY IF EXISTS "Apenas admins podem deletar usuários" ON usuarios;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver usuários" ON usuarios;

CREATE POLICY "Allow all operations on usuarios" ON usuarios
  FOR ALL USING (true) WITH CHECK (true);