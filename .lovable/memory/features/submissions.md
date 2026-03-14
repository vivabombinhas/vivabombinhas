Fluxo de submissão de imóveis: formulário público → imoveis_submissions (pendente) → admin review → aprovado copia para imoveis.

## Tabela imoveis_submissions
- Enum status_submission: pendente, aprovado, rejeitado
- Campo imovel_id referencia imoveis(id) após aprovação
- RLS: insert público, select/update só admin

## Rotas
- /admin/submissions - painel de revisão (ProtectedAdminRoute)
- Formulário em PartnersSection.tsx grava em imoveis_submissions (não mais em imoveis)
