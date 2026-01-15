-- Add embedding column to knowledge_chunks table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_chunks' 
    AND column_name = 'embedding'
  ) THEN
    ALTER TABLE knowledge_chunks 
    ADD COLUMN embedding vector(1536);
    
    -- Create an index for vector similarity search
    CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
    ON knowledge_chunks 
    USING ivfflat (embedding vector_cosine_ops);
  END IF;
END $$;
