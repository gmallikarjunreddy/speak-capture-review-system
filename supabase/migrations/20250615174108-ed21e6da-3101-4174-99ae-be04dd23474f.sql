
-- The 'id' column in the 'recordings' table is currently a UUID, which generates a random ID.
-- To use a custom ID like "FULLNAME_SENTENCENUMBER", we need to change its type to TEXT.

-- First, we need to remove the Primary Key constraint to change the column type.
ALTER TABLE public.recordings DROP CONSTRAINT recordings_pkey;

-- Next, we change the column 'id' type from UUID to TEXT.
ALTER TABLE public.recordings ALTER COLUMN id TYPE TEXT;

-- Then, we remove the default value generator for the 'id' column.
ALTER TABLE public.recordings ALTER COLUMN id DROP DEFAULT;

-- Finally, we add the Primary Key constraint back to the 'id' column.
ALTER TABLE public.recordings ADD CONSTRAINT recordings_pkey PRIMARY KEY (id);
