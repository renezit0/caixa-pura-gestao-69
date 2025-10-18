-- Corrigir RLS da tabela despesas para funcionar sem Supabase Auth
-- Como não usamos Supabase Auth, vamos permitir todas operações
DROP POLICY IF EXISTS "Usuários autenticados podem ver despesas" ON despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir despesas" ON despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar despesas" ON despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar despesas" ON despesas;

-- Criar políticas que permitem acesso sem auth.uid()
CREATE POLICY "Allow all to view despesas" ON despesas
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert despesas" ON despesas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update despesas" ON despesas
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all to delete despesas" ON despesas
  FOR DELETE USING (true);