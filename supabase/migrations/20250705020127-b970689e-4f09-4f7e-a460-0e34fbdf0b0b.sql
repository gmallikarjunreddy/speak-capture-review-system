
-- First, we need to handle the foreign key constraint and change sentence IDs to integers
-- This migration will convert sentence IDs from UUID to auto-increment integers

-- Step 1: Create a temporary mapping table to preserve sentence data
CREATE TABLE temp_sentence_mapping (
    old_id UUID,
    new_id SERIAL,
    text TEXT
);

-- Step 2: Insert existing sentences into mapping table
INSERT INTO temp_sentence_mapping (old_id, text)
SELECT id, text FROM sentences ORDER BY created_at;

-- Step 3: Drop foreign key constraints
ALTER TABLE recordings DROP CONSTRAINT IF EXISTS recordings_sentence_id_fkey;

-- Step 4: Add new integer sentence_id column to recordings
ALTER TABLE recordings ADD COLUMN new_sentence_id INTEGER;

-- Step 5: Update recordings with new integer sentence IDs
UPDATE recordings 
SET new_sentence_id = temp_sentence_mapping.new_id
FROM temp_sentence_mapping 
WHERE recordings.sentence_id::text = temp_sentence_mapping.old_id::text;

-- Step 6: Drop old sentence_id column and rename new one
ALTER TABLE recordings DROP COLUMN sentence_id;
ALTER TABLE recordings RENAME COLUMN new_sentence_id TO sentence_id;

-- Step 7: Recreate sentences table with integer primary key
DROP TABLE sentences;
CREATE TABLE sentences (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Step 8: Insert sentences back with their new integer IDs
INSERT INTO sentences (id, text, is_active, created_at)
SELECT new_id, text, true, NOW()
FROM temp_sentence_mapping
ORDER BY new_id;

-- Step 9: Update the sequence to continue from the highest ID
SELECT setval('sentences_id_seq', (SELECT MAX(id) FROM sentences));

-- Step 10: Add foreign key constraint back
ALTER TABLE recordings 
ADD CONSTRAINT recordings_sentence_id_fkey 
FOREIGN KEY (sentence_id) REFERENCES sentences(id);

-- Step 11: Clean up temporary table
DROP TABLE temp_sentence_mapping;

-- Step 12: Create indexes for better performance
CREATE INDEX idx_recordings_sentence_id ON recordings(sentence_id);
CREATE INDEX idx_sentences_is_active ON sentences(is_active);
