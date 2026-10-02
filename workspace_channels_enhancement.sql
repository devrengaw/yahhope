-- Migração para suporte a criador do canal e deduplicação
ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Opcional: remover canais duplicados mantendo apenas um por nome (se houver)
DELETE FROM public.workspace_channels a USING public.workspace_channels b
WHERE a.id > b.id AND lower(trim(a.name)) = lower(trim(b.name));
