Atualizar a secret `CORE_EDGE_SECRET` para o valor `vivabombinhas-core-2026` usando `secrets--update_secret` (a secret já existe, então `set_secret` não sobrescreveria).

Nenhuma alteração de código é necessária — a Edge Function `buscar-imoveis` já lê `Deno.env.get("CORE_EDGE_SECRET")` em runtime e passará a validar contra o novo valor automaticamente após a atualização.

Após aplicar, o MarIA Core (Render) deve passar a enviar o header:
```
x-core-secret: vivabombinhas-core-2026
```