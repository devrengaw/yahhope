-- Add module column to finance_transactions to separate global from nutrition
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'global';

-- Update existing transactions to be 'global' if they are null
UPDATE finance_transactions SET module = 'global' WHERE module IS NULL;

-- Create nutrition_staff table for HR management within Nutrition
CREATE TABLE IF NOT EXISTS nutrition_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- e.g., 'volunteer', 'contractor'
  cost_aid_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for the new table
-- ALTER PUBLICATION supabase_realtime ADD TABLE nutrition_staff;

-- Insert some default categories for nutrition
INSERT INTO finance_categories (id, name, type, color, icon) VALUES
('cat_nutri_food', 'Alimentação', 'expense', 'bg-orange-100 text-orange-600', 'Package'),
('cat_nutri_transport', 'Transporte', 'expense', 'bg-blue-100 text-blue-600', 'Car'),
('cat_nutri_aid', 'Ajuda de Custo', 'expense', 'bg-rose-100 text-rose-600', 'Users'),
('cat_nutri_other', 'Outros', 'expense', 'bg-slate-100 text-slate-600', 'MoreVertical')
ON CONFLICT (id) DO NOTHING;
