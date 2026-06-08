CREATE OR REPLACE FUNCTION public.check_maria_filter_spikes()
RETURNS TABLE (filter_name TEXT, current_count BIGINT, previous_count BIGINT, spike_percentage NUMERIC) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT unnest(missing_filters) as f, count(*) as cnt
    FROM maria_search_metrics
    WHERE created_at > now() - interval '24 hours'
    AND has_shown_results = false
    GROUP BY 1
  ),
  previous_period AS (
    SELECT unnest(missing_filters) as f, count(*) as cnt
    FROM maria_search_metrics
    WHERE created_at BETWEEN now() - interval '48 hours' AND now() - interval '24 hours'
    AND has_shown_results = false
    GROUP BY 1
  )
  SELECT 
    c.f as filter_name,
    c.cnt as current_count,
    COALESCE(p.cnt, 0) as previous_count,
    CASE 
      WHEN COALESCE(p.cnt, 0) = 0 THEN 100.0 
      ELSE ((c.cnt::numeric - p.cnt::numeric) / p.cnt::numeric) * 100.0 
    END as spike_percentage
  FROM current_period c
  LEFT JOIN previous_period p ON c.f = p.f
  WHERE (CASE WHEN COALESCE(p.cnt, 0) = 0 THEN 100.0 ELSE ((c.cnt::numeric - p.cnt::numeric) / p.cnt::numeric) * 100.0 END) >= 50.0
  AND c.cnt > 5; -- Only alert if there's a significant number of occurrences
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_maria_filter_spikes() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_maria_filter_spikes() TO authenticated;
