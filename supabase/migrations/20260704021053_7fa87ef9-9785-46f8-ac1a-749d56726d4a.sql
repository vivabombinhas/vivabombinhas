DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lead_status_audit'
      AND policyname = 'Admins can insert audit'
  ) THEN
    CREATE POLICY "Admins can insert audit"
      ON public.lead_status_audit
      FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;