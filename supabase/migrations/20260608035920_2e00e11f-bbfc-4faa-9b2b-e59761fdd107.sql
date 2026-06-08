CREATE TABLE public.maria_search_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  finalidade TEXT,
  missing_filters TEXT[],
  message_count INTEGER DEFAULT 0,
  has_shown_results BOOLEAN DEFAULT false,
  intent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maria_search_metrics TO authenticated;
GRANT ALL ON public.maria_search_metrics TO service_role;

ALTER TABLE public.maria_search_metrics ENABLE ROW LEVEL SECURITY;

-- No specific policy needed for now as it's mainly for service_role/internal logging, 
-- but we can add one for authenticated if we want to show it in a dashboard.
CREATE POLICY "Service role can do everything" ON public.maria_search_metrics FOR ALL USING (true) WITH CHECK (true);
