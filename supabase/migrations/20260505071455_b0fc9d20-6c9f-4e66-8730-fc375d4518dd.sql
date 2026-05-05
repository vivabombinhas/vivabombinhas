-- Create AI configuration table
CREATE TABLE IF NOT EXISTS public.ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-exp',
    temperature FLOAT NOT NULL DEFAULT 0.7,
    system_prompt TEXT,
    max_tokens INTEGER DEFAULT 1000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Create policies (Everyone can read, only service_role/admin can write)
-- Note: In a real app, you'd restrict SELECT to authenticated if needed, 
-- but the Edge Function needs access to read it.
CREATE POLICY "Enable read access for all" ON public.ai_config FOR SELECT USING (true);

-- Insert default configuration if table is empty
INSERT INTO public.ai_config (model, temperature, max_tokens)
SELECT 'google/gemini-2.0-flash-exp', 0.7, 1000
WHERE NOT EXISTS (SELECT 1 FROM public.ai_config);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_config_updated_at
    BEFORE UPDATE ON public.ai_config
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();