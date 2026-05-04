CREATE POLICY "Owners can view matched leads" 
ON public.leads_maria 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lead_matches 
    JOIN public.imoveis ON public.imoveis.id = lead_matches.imovel_id
    WHERE lead_matches.lead_id = leads_maria.id 
    AND public.imoveis.user_id = auth.uid()
  )
);
