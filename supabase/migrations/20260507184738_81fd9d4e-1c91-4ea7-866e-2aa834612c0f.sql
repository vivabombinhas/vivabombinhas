-- Table for real-time notifications
CREATE TABLE IF NOT EXISTS public.broker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_maria(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id TEXT
);

-- Enable RLS
ALTER TABLE public.broker_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users (brokers/admins) can see all notifications
CREATE POLICY "Brokers can view notifications" 
ON public.broker_notifications 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Service role can insert
CREATE POLICY "System can insert notifications" 
ON public.broker_notifications 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Function to notify via trigger (if needed) or direct insert
CREATE OR REPLACE FUNCTION public.get_qualified_leads_stats()
RETURNS TABLE(total bigint, unread bigint) AS $$
BEGIN
    RETURN QUERY SELECT 
        count(*),
        count(*) FILTER (WHERE NOT read)
    FROM public.broker_notifications;
END;
$$ LANGUAGE plpgsql STABLE;