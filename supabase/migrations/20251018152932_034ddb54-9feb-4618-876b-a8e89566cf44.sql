-- Remover políticas antigas do bucket logos
DROP POLICY IF EXISTS "Todos podem ver logos" ON storage.objects;
DROP POLICY IF EXISTS "Apenas admins podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Apenas admins podem atualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Apenas admins podem deletar logos" ON storage.objects;

-- Criar políticas mais simples para o bucket logos
-- Permitir acesso público para visualização
CREATE POLICY "Public can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Permitir upload/update/delete para todos usuários autenticados
-- (já que não estamos usando Supabase Auth, vamos liberar)
CREATE POLICY "Anyone can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can update logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos')
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can delete logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos');