-- Schema v9: add sharing support to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS chats_share_id ON chats(share_id) WHERE is_shared = TRUE;
