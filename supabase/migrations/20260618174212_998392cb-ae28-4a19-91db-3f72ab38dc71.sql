
-- Lock down maria_messages: remove public read/insert; restrict to admins + service_role
DROP POLICY IF EXISTS "Enable read access for all" ON public.maria_messages;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.maria_messages;

-- Revoke any direct privileges from anon/authenticated
REVOKE ALL ON public.maria_messages FROM anon;
REVOKE ALL ON public.maria_messages FROM authenticated;

-- Ensure service_role has full access (used by Edge Functions)
GRANT ALL ON public.maria_messages TO service_role;

-- Admin role can read all messages (for CRM)
GRANT SELECT ON public.maria_messages TO authenticated;

ALTER TABLE public.maria_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all maria messages"
ON public.maria_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
