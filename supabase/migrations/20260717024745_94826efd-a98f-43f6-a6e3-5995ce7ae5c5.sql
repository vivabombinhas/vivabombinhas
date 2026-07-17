CREATE TABLE public.maria_pausas (
  phone TEXT PRIMARY KEY,
  paused BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.maria_pausas TO service_role;

ALTER TABLE public.maria_pausas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_maria_pausas_updated_at
BEFORE UPDATE ON public.maria_pausas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();