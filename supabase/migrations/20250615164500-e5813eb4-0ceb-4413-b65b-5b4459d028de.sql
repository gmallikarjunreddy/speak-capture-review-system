
-- Remove "category" column from sentences table
ALTER TABLE public.sentences DROP COLUMN IF EXISTS category;
