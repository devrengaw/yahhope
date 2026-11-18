-- Adiciona colunas de redes sociais na tabela organization_settings
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com',
  ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT 'https://youtube.com',
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT 'https://facebook.com',
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT 'https://linkedin.com';

-- Garante valores padrão caso a linha 'default' já exista com valores nulos
UPDATE public.organization_settings
SET
  instagram_url = COALESCE(instagram_url, 'https://instagram.com'),
  youtube_url = COALESCE(youtube_url, 'https://youtube.com'),
  facebook_url = COALESCE(facebook_url, 'https://facebook.com'),
  linkedin_url = COALESCE(linkedin_url, 'https://linkedin.com')
WHERE id = 'default';
