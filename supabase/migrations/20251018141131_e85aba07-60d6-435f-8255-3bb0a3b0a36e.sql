-- Remover política antiga de SELECT que requeria autenticação
DROP POLICY IF EXISTS "Usuários autenticados podem ver configurações" ON public.configuracoes;

-- Criar nova política permitindo leitura pública (configurações não são dados sensíveis)
CREATE POLICY "Permitir leitura de configurações"
ON public.configuracoes FOR SELECT
USING (true);

-- As políticas de UPDATE e INSERT continuam requerendo admin, o que está correto