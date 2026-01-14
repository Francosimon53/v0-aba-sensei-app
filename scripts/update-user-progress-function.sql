-- Function to update user progress after each answer
-- This function is called from the application code
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_user_progress(
  p_user_id UUID,
  p_category_id TEXT,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_progress (
    user_id, 
    category_id, 
    questions_attempted, 
    questions_correct, 
    current_streak, 
    best_streak, 
    last_practiced_at
  )
  VALUES (
    p_user_id, 
    p_category_id, 
    1, 
    CASE WHEN p_is_correct THEN 1 ELSE 0 END, 
    CASE WHEN p_is_correct THEN 1 ELSE 0 END, 
    CASE WHEN p_is_correct THEN 1 ELSE 0 END, 
    NOW()
  )
  ON CONFLICT (user_id, category_id) DO UPDATE SET
    questions_attempted = user_progress.questions_attempted + 1,
    questions_correct = user_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    current_streak = CASE WHEN p_is_correct THEN user_progress.current_streak + 1 ELSE 0 END,
    best_streak = GREATEST(
      user_progress.best_streak, 
      CASE WHEN p_is_correct THEN user_progress.current_streak + 1 ELSE user_progress.current_streak END
    ),
    mastery_level = CASE
      WHEN (user_progress.questions_attempted + 1) < 5 THEN 'novice'
      WHEN (user_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::FLOAT / (user_progress.questions_attempted + 1) >= 0.9 
        AND (user_progress.questions_attempted + 1) >= 20 THEN 'master'
      WHEN (user_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::FLOAT / (user_progress.questions_attempted + 1) >= 0.8 
        AND (user_progress.questions_attempted + 1) >= 15 THEN 'advanced'
      WHEN (user_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::FLOAT / (user_progress.questions_attempted + 1) >= 0.7 
        AND (user_progress.questions_attempted + 1) >= 10 THEN 'intermediate'
      ELSE 'novice'
    END,
    last_practiced_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_progress(UUID, TEXT, BOOLEAN) TO authenticated;
