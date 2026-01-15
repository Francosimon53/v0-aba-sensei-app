-- Create function for vector similarity search in knowledge_chunks
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_exam_level text DEFAULT 'bcba'
)
RETURNS TABLE (
  id uuid,
  task_id text,
  task_text text,
  keywords text,
  domain text,
  exam_level text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.task_id,
    knowledge_chunks.task_text,
    knowledge_chunks.keywords,
    knowledge_chunks.domain,
    knowledge_chunks.exam_level,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks
  WHERE 
    knowledge_chunks.embedding IS NOT NULL
    AND knowledge_chunks.exam_level = p_exam_level
    AND 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
