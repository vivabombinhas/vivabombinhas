DROP POLICY "Service role can do everything" ON public.maria_search_metrics;

CREATE POLICY "Service role can do everything" ON public.maria_search_metrics 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated to read (e.g. for a dashboard)
CREATE POLICY "Authenticated users can read metrics" ON public.maria_search_metrics
FOR SELECT
TO authenticated
USING (true);
