
-- Allow admins to insert operator (WhatsApp) records into maria_messages
CREATE POLICY "Admins can insert maria messages"
ON public.maria_messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for maria_messages
ALTER TABLE public.maria_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maria_messages;
