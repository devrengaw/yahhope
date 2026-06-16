-- 1. Tabela para o Calendário ERP
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

-- 2. Tabela para Projetos do Site Público da ONG
CREATE TABLE IF NOT EXISTS website_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'planned', 'completed')),
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Inserir alguns dados iniciais para o site não ficar vazio
INSERT INTO website_projects (title, description, status, image_url)
VALUES 
  ('Desnutrição Infantil', 'Acompanhamento nutricional e fornecimento de suplementos para crianças em situação de vulnerabilidade.', 'active', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'),
  ('Infraestrutura Comunitária', 'Melhoria das condições habitacionais e de saneamento básico nas comunidades atendidas.', 'planned', 'https://images.unsplash.com/photo-1541888086925-eb38890db313?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')
ON CONFLICT DO NOTHING;

-- 3. Tabela para Categorias de Equipe/Usuários
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Tabela para Visitas Domiciliares (ACS)
CREATE TABLE IF NOT EXISTS home_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  acs_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  house_cleanliness integer,
  vitamins_followed boolean,
  medical_recommendations_followed boolean,
  observations text,
  next_visit_date date,
  last_clinical_date date,
  created_at timestamptz DEFAULT now()
);
