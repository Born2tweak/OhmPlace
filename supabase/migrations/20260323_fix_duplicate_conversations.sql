-- Fix duplicate conversations caused by bidirectional (A,B) / (B,A) rows
-- Run this in the Supabase SQL Editor

-- Step 1: Deduplicate existing conversations by merging (B,A) rows into (A,B)
-- For each pair that has both orderings, delete the newer duplicate and
-- re-point any messages that referenced it to the older one.

DO $$
DECLARE
    dup RECORD;
BEGIN
    FOR dup IN
        SELECT
            a.id AS keep_id,
            b.id AS del_id
        FROM conversations a
        JOIN conversations b
          ON a.participant_1 = b.participant_2
         AND a.participant_2 = b.participant_1
         AND a.id < b.id  -- keep lexicographically smaller id
    LOOP
        -- Re-point messages from the duplicate to the keeper
        UPDATE messages SET conversation_id = dup.keep_id WHERE conversation_id = dup.del_id;
        -- Delete the duplicate
        DELETE FROM conversations WHERE id = dup.del_id;
    END LOOP;
END $$;

-- Step 2: Canonicalize ordering — make sure participant_1 < participant_2 for all rows
UPDATE conversations
SET participant_1 = participant_2, participant_2 = participant_1
WHERE participant_1 > participant_2;

-- Step 3: Drop the old unidirectional unique constraint and add a canonical one
-- (participant_1 is always the lexicographically smaller of the two)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_1_participant_2_key;

ALTER TABLE conversations
    ADD CONSTRAINT conversations_participants_unique
    UNIQUE (participant_1, participant_2)
    DEFERRABLE INITIALLY IMMEDIATE;

-- Enforce canonical ordering at the DB level with a check constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_canonical_order;
ALTER TABLE conversations
    ADD CONSTRAINT conversations_canonical_order
    CHECK (participant_1 < participant_2);
