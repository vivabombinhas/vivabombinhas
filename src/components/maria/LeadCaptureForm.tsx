import { useState } from "react";
import { Sparkles, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LeadCaptureFormProps {
  remainingCount: number;
  isAlertMode?: boolean; // true quando é "sem resultados → alerta"
  onSubmit: (nome: string, telefone: string) => Promise<boolean>;
}

// Validação: BR (10-11 dígitos com DDD) ou AR (+54 com 10-11 dígitos)
function isValidPhone(raw: string): boolean {
  const original = raw.trim();
  let digits = original.replace(/\D/g, "");
  if (!digits) return false;
  const hasPlus54 = /^\+?\s*54/.test(original);
  if (hasPlus54 || (digits.startsWith("54") && digits.length >= 12)) {
    if (digits.startsWith("54")) digits = digits.slice(2);
    return digits.length >= 10 && digits.length <= 11;
  }
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits.length >= 10 && digits.length <= 11;
}

export function LeadCaptureForm({ remainingCount, isAlertMode: isAlertModeProp, onSubmit }: LeadCaptureFormProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNome = nome.trim();
    if (trimmedNome.length < 2) {
      setError("Por favor, informe seu nome.");
      return;
    }
    if (!isValidPhone(telefone)) {
      setError("Número inválido. Inclua o DDD. Ex: 47 99999-8888");
      return;
    }

    setLoading(true);
    try {
      const ok = await onSubmit(trimmedNome, telefone.trim());
      if (!ok) setError("Não consegui salvar agora. Tente novamente, por favor.");
    } catch {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // alert mode = sem resultados (override por prop, ou fallback histórico de remainingCount===0 sem prop)
  const isAlertMode = isAlertModeProp ?? remainingCount === 0;
  const isContactUnlock = !isAlertMode && remainingCount === 0; // 1 imóvel teaser sem extras

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4 shadow-md">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            {isAlertMode
              ? "🔔 Te aviso quando houver novidades"
              : isContactUnlock
              ? "🔓 Libere o contato direto do anunciante"
              : `🏠 Encontrei ${remainingCount} ${remainingCount === 1 ? "imóvel" : "imóveis"} no seu perfil`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {isAlertMode ? (
              <>
                Posso te avisar quando entrar um imóvel <strong className="text-foreground">parecido com esse perfil</strong> no portal.
              </>
            ) : isContactUnlock ? (
              <>
                Me informe seu nome e WhatsApp para eu liberar o <strong className="text-foreground">link e o contato direto</strong> desse imóvel.
              </>
            ) : (
              <>
                Me informe seu contato para eu liberar os <strong className="text-foreground">outros imóveis</strong> agora e te avisar se entrar algo novo.
              </>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <Input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          autoComplete="name"
          className="bg-background border-border h-10 text-sm"
          maxLength={80}
        />
        <Input
          type="tel"
          placeholder="WhatsApp com DDD (ex: 47 99999-8888)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          disabled={loading}
          autoComplete="tel"
          inputMode="tel"
          className="bg-background border-border h-10 text-sm"
          maxLength={25}
        />

        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {isAlertMode ? "Ativando alerta..." : "Liberando..."}
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-2" />
              {isAlertMode ? "Ativar alerta de novidade" : "Liberar todos os imóveis"}
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          🔒 Seus dados ficam protegidos. Sem spam, prometo. 💛
        </p>
      </form>
    </div>
  );
}
