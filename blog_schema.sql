-- ==============================================================================
-- SCHEMA DO BLOG DA YAH HOPE (POSTS, MÉTRICAS E STORAGE)
-- Execute este script no SQL Editor do seu painel do Supabase
-- ==============================================================================

-- 1. Criação da tabela de postagens do blog (caso não exista)
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT DEFAULT 'YAH Hope',
  date TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'published', -- 'published', 'draft', 'review', 'scheduled', 'trash', 'hidden'
  category TEXT DEFAULT 'Geral',
  image TEXT DEFAULT 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
  featured_home BOOLEAN DEFAULT false,
  highlight_type TEXT DEFAULT 'split',
  highlight_color TEXT DEFAULT '#F49853',
  views_count INTEGER DEFAULT 0,
  reads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  translations JSONB DEFAULT '["pt"]'::jsonb,
  has_unpublished_changes BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migração segura: Adicionar colunas se a tabela já existia anteriormente
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'views_count') THEN
    ALTER TABLE blog_posts ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'reads_count') THEN
    ALTER TABLE blog_posts ADD COLUMN reads_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'likes_count') THEN
    ALTER TABLE blog_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'shares_count') THEN
    ALTER TABLE blog_posts ADD COLUMN shares_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'comments_count') THEN
    ALTER TABLE blog_posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'translations') THEN
    ALTER TABLE blog_posts ADD COLUMN translations JSONB DEFAULT '["pt"]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'has_unpublished_changes') THEN
    ALTER TABLE blog_posts ADD COLUMN has_unpublished_changes BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'deleted_at') THEN
    ALTER TABLE blog_posts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured_home ON blog_posts(featured_home);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública de artigos" ON blog_posts;
DROP POLICY IF EXISTS "Permitir inserção de artigos" ON blog_posts;
DROP POLICY IF EXISTS "Permitir atualização de artigos" ON blog_posts;
DROP POLICY IF EXISTS "Permitir exclusão de artigos" ON blog_posts;
DROP POLICY IF EXISTS "Permitir controle total de posts" ON blog_posts;

-- Criar políticas permissivas para o blog
CREATE POLICY "Permitir leitura pública de artigos"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir inserção de artigos"
  ON blog_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de artigos"
  ON blog_posts FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir exclusão de artigos"
  ON blog_posts FOR DELETE
  TO anon, authenticated
  USING (true);

-- 5. Bucket de Armazenamento para Fotos do Blog (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso público para o bucket de imagens do blog
DROP POLICY IF EXISTS "Permitir visualização pública de imagens do blog" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de imagens do blog" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens do blog" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleção de imagens do blog" ON storage.objects;

CREATE POLICY "Permitir visualização pública de imagens do blog"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Permitir upload de imagens do blog"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Permitir atualização de imagens do blog"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Permitir deleção de imagens do blog"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

-- 6. Inserção / Atualização dos artigos iniciais com as métricas da referência
INSERT INTO blog_posts (
  id, title, excerpt, content, author, date, status, category, image, 
  featured_home, highlight_type, highlight_color, 
  views_count, reads_count, likes_count, shares_count, comments_count, translations
)
VALUES 
  (
    'post-1',
    'O propósito de uma ilha',
    'Nosso centro nutricional acolhe crianças em estado crítico de vulnerabilidade alimentar, fornecendo dietas balanceadas e assistência médica contínua.',
    '<p>Na província de Nampula, em Moçambique, a desnutrição infantil severa é uma das maiores ameaças ao desenvolvimento e sobrevivência de crianças em seus primeiros anos de vida.</p><p>A Casa Nutri nasceu para transformar essa realidade. Com acompanhamento clínico semanal, introdução alimentar fortificada e educação nutricional para as mães, resgatamos crianças da curva crítica de desnutrição.</p><h3>Impacto Direto</h3><ul><li>Mais de 1.800 refeições terapêuticas distribuídas a cada mês.</li><li>Recuperação do peso ideal e fortalecimento imunológico.</li><li>Acompanhamento médico e psicológico com a família.</li></ul><p>Cada sorriso devolvido representa o futuro que renasce em solo fértil de esperança e solidariedade.</p>',
    'YAH Hope',
    '2024-03-25',
    'published',
    'Nutrição & Saúde Infantil',
    'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    true,
    'photo',
    '#92BF78',
    47, 32, 4, 2, 0,
    '["pt"]'::jsonb
  ),
  (
    'post-2',
    'Um problema crônico',
    'Compreendendo as raízes históricas e estruturais das dificuldades alimentares e como a capacitação comunitária rompe ciclos geracionais.',
    '<p>O acesso à água potável e nutrição digna em Moçambique continua sendo um desafio para milhões de famílias vulneráveis.</p><p>Nossa missão atua não somente no socorro emergencial imediato, mas no empoderamento sustentável da comunidade com poços artesianos e hortas agroecológicas.</p>',
    'Carolina Simionato',
    '2024-01-16',
    'published',
    'Tudo sobre Moçambique',
    'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    false,
    'split',
    '#88A1F2',
    23, 18, 7, 3, 0,
    '["pt"]'::jsonb
  ),
  (
    'post-3',
    'Você tem a firme certeza?',
    'Uma reflexão sobre fé em ação prática, generosidade com propósito e o chamado individual para transformar a dor do próximo em esperança.',
    '<p>A compaixão que não se move em direção ao necessitado permanece apenas como um belo sentimento. O Evangelho vivo se manifesta no prato de comida e no remédio entregue.</p>',
    'Carolina Simionato',
    '2023-11-18',
    'published',
    'Pense e reflita',
    'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    false,
    'split',
    '#EBC878',
    15, 11, 3, 1, 0,
    '["pt"]'::jsonb
  ),
  (
    'post-4',
    'O início',
    'Relato dos primeiros passos da YAH Hope nas aldeias de Nampula, os desafios do acolhimento e as sementes que germinaram.',
    '<p>Chegar em uma nova comunidade exige respeito, escuta atenta e vínculo sincero. Antes de qualquer projeto, sentamos com os anciãos e as mães locais.</p>',
    'Carolina Simionato',
    '2023-11-18',
    'published',
    'Viagens',
    'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    true,
    'photo',
    '#F49853',
    38, 26, 4, 4, 0,
    '["pt"]'::jsonb
  ),
  (
    'post-5',
    'Um pouco sobre Moçambique',
    'Cultura, resiliência e as histórias humanas por trás das paisagens e da nossa frente de atuação humanitária.',
    '<p>Moçambique é uma terra de rica herança cultural, acolhimento caloroso e pessoas extraordinariamente resilientes.</p>',
    'Carolina Simionato',
    '2023-11-18',
    'published',
    'Tudo sobre Moçambique',
    '/login_bg_real.jpg',
    true,
    'split',
    '#92BF78',
    23, 16, 5, 2, 0,
    '["pt"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  views_count = EXCLUDED.views_count,
  reads_count = EXCLUDED.reads_count,
  likes_count = EXCLUDED.likes_count,
  shares_count = EXCLUDED.shares_count,
  comments_count = EXCLUDED.comments_count,
  category = EXCLUDED.category,
  translations = EXCLUDED.translations;
