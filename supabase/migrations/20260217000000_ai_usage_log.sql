-- AI usage tracking for cost monitoring
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_log_created ON ai_usage_log(created_at);
CREATE INDEX idx_ai_usage_log_user ON ai_usage_log(user_id);

-- RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can insert usage" ON ai_usage_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read usage" ON ai_usage_log
  FOR SELECT USING (auth.role() = 'authenticated');
