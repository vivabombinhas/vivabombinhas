CREATE TABLE public.maria_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    lead_id UUID REFERENCES public.leads_maria(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup in CRM
CREATE INDEX idx_maria_messages_session_id ON public.maria_messages(session_id);
CREATE INDEX idx_maria_messages_lead_id ON public.maria_messages(lead_id);

-- Add missing columns to leads_maria if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads_maria' AND column_name='orcamento_min') THEN
        ALTER TABLE public.leads_maria ADD COLUMN orcamento_min NUMERIC;
    END IF;
END $$;

-- Enable RLS and setup policies
ALTER TABLE public.maria_messages ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.maria_messages TO service_role;
GRANT SELECT, INSERT ON public.maria_messages TO authenticated;
GRANT SELECT, INSERT ON public.maria_messages TO anon;

-- CRM policy: Authenticated users (Daniel) can view messages
CREATE POLICY "Enable read access for all" ON public.maria_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON public.maria_messages FOR INSERT WITH CHECK (true);
