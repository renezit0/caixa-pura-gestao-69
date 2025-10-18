-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave character varying NOT NULL UNIQUE,
  valor boolean NOT NULL DEFAULT false,
  descricao text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para configurações
CREATE POLICY "Usuários autenticados podem ver configurações"
ON public.configuracoes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Administradores podem atualizar configurações"
ON public.configuracoes FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Administradores podem inserir configurações"
ON public.configuracoes FOR INSERT
WITH CHECK (is_admin());

-- Inserir configurações padrão
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
  ('venda_sem_cadastro', false, 'Permitir venda de produtos não cadastrados no PDV'),
  ('exibir_produtos_temporarios', false, 'Exibir produtos temporários na lista de produtos');

-- Adicionar campo para marcar produtos temporários (criados no PDV)
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS produto_temporario boolean DEFAULT false;