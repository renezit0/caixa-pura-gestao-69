-- Remover políticas antigas que usam auth.uid() e is_admin()
-- e criar políticas que permitem todas operações (já que não usamos Supabase Auth)

-- CATEGORIAS
DROP POLICY IF EXISTS "Administradores podem atualizar categorias" ON categorias;
DROP POLICY IF EXISTS "Administradores podem inserir categorias" ON categorias;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar categorias" ON categorias;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir categorias" ON categorias;
DROP POLICY IF EXISTS "Usuários autenticados podem ver categorias" ON categorias;

CREATE POLICY "Allow all operations on categorias" ON categorias
  FOR ALL USING (true) WITH CHECK (true);

-- FORNECEDORES
DROP POLICY IF EXISTS "Administradores podem atualizar fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Administradores podem inserir fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Usuários autenticados podem ver fornecedores" ON fornecedores;

CREATE POLICY "Allow all operations on fornecedores" ON fornecedores
  FOR ALL USING (true) WITH CHECK (true);

-- PRODUTOS
DROP POLICY IF EXISTS "Administradores podem atualizar produtos" ON produtos;
DROP POLICY IF EXISTS "Administradores podem inativar produtos" ON produtos;
DROP POLICY IF EXISTS "Administradores podem inserir produtos" ON produtos;
DROP POLICY IF EXISTS "Administradores podem inserir produtoss" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem inativar produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver produtos" ON produtos;

CREATE POLICY "Allow all operations on produtos" ON produtos
  FOR ALL USING (true) WITH CHECK (true);

-- CONFIGURACOES
DROP POLICY IF EXISTS "Administradores podem atualizar configurações" ON configuracoes;
DROP POLICY IF EXISTS "Administradores podem inserir configurações" ON configuracoes;
DROP POLICY IF EXISTS "Permitir leitura de configurações" ON configuracoes;

CREATE POLICY "Allow all operations on configuracoes" ON configuracoes
  FOR ALL USING (true) WITH CHECK (true);