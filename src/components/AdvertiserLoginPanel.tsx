import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

export default function AdvertiserLoginPanel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });
    setAuthLoading(false);
    if (error) {
      toast.error("Erro ao enviar link de acesso: " + error.message);
    } else {
      setSent(true);
      toast.success("Link de acesso enviado para seu e-mail!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl border shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Painel do Anunciante</h1>
          <p className="text-muted-foreground text-sm">
            Acesse para acompanhar suas submissões e ver seus interessados.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100">
              Verifique sua caixa de entrada! Enviamos um link de acesso para <strong>{email}</strong>.
            </div>
            <Button variant="ghost" onClick={() => setSent(false)} className="text-xs">
              Não recebeu? Tentar novamente
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? "Enviando..." : "Entrar com Link Mágico"}
            </Button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={() => navigate("/anuncie")} className="w-full">
            Quero Anunciar um Imóvel
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} className="w-full text-xs">
            Voltar para o Início
          </Button>
        </div>
      </div>
    </div>
  );
}
