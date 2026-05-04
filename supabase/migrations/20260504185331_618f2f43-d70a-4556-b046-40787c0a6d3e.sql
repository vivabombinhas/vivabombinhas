CREATE POLICY "Owners can view matches for their properties" 
ON public.lead_matches 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis 
    WHERE public.imoveis.id = lead_matches.imovel_id 
    AND public.imoveis.user_id = auth.uid()
  )
);
