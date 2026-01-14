-- Create user_progress table for tracking question answers
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  user_answer INTEGER NOT NULL,
  correct_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  exam_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_progress_created_at ON user_progress(created_at DESC);

-- Create index on category for filtering by category
CREATE INDEX IF NOT EXISTS idx_user_progress_category ON user_progress(category);

-- Create index on exam_type for filtering by exam type
CREATE INDEX IF NOT EXISTS idx_user_progress_exam_type ON user_progress(exam_type);
