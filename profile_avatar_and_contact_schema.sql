-- ==============================================================================
-- Schema Migration: Suporte a Foto de Perfil (Avatar), Telefone e Bio/Sobre
-- ==============================================================================

-- 1. Adicionar colunas na tabela public.users (caso ainda não existam)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS about TEXT;

-- 2. Garantir a existência do Bucket 'avatars' no Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB (fotos são comprimidas pelo app para < 100KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- 3. Políticas de Segurança (RLS) para o bucket 'avatars'

-- Permitir que qualquer pessoa visualize as fotos de perfil públicas
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload de suas fotos
DROP POLICY IF EXISTS "Authenticated Users Upload Avatar" ON storage.objects;
CREATE POLICY "Authenticated Users Upload Avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados atualizem/substituam suas fotos
DROP POLICY IF EXISTS "Authenticated Users Update Avatar" ON storage.objects;
CREATE POLICY "Authenticated Users Update Avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados removam fotos
DROP POLICY IF EXISTS "Authenticated Users Delete Avatar" ON storage.objects;
CREATE POLICY "Authenticated Users Delete Avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
