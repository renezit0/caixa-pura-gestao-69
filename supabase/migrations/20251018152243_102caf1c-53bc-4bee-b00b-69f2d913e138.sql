-- Criar tabela de informações da empresa
CREATE TABLE IF NOT EXISTS public.empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL DEFAULT 'seeStore',
  logo_url TEXT,
  endereco TEXT,
  telefone VARCHAR(50),
  email VARCHAR(255),
  cnpj VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir registro padrão da empresa
INSERT INTO public.empresa (nome) 
VALUES ('seeStore')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;

-- Criar policies para empresa
CREATE POLICY "Todos podem ver informações da empresa"
  ON public.empresa FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem atualizar empresa"
  ON public.empresa FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid() OR id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      )
      AND tipo_usuario = 'admin'
    )
  );

-- Criar bucket para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket de logos
CREATE POLICY "Todos podem ver logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Apenas admins podem fazer upload de logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid()
      )
      AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid()
      )
      AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem deletar logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid()
      )
      AND tipo_usuario = 'admin'
    )
  );

-- Enable RLS on usuarios for management
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Policies para gerenciamento de usuários
CREATE POLICY "Todos usuários autenticados podem ver usuários"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem criar usuários"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid()
      )
      AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar usuários"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid()
      )
      AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem deletar usuários"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = (
        SELECT id FROM public.usuarios 
        WHERE auth_user_id = auth.uid()
      )
      AND tipo_usuario = 'admin'
    )
  );