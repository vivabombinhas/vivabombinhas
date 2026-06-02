import { useState } from "react";
import { Sparkles, Loader2, Lock, Globe, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadCaptureFormProps {
  remainingCount: number;
  isAlertMode?: boolean; 
  isStrategicMode?: boolean;
  onSubmit: (nome: string, telefone: string, extraData?: any) => Promise<boolean>;
}

const COUNTRY_CODES = [
  { code: "55", label: "🇧🇷 BR +55" },
  { code: "54", label: "🇦🇷 AR +54" },
  { code: "598", label: "🇺🇾 UY +598" },
  { code: "56", label: "🇨🇱 CL +56" },
  { code: "595", label: "🇵🇾 PY +595" },
  { code: "1", label: "🇺🇸 US +1" },
  { code: "351", label: "🇵🇹 PT +351" },
];

function isValidPhone(raw: string, countryCode: string): boolean {
  let digits = raw.trim().replace(/\D/g, "");
  if (!digits) return false;
  
  // Para Brasil, exigimos DDD (10 ou 11 dígitos)
  if (countryCode === "55") {
    return digits.length >= 10 && digits.length <= 11;
  }
  
  // Outros países: validação básica de tamanho
  return digits.length >= 8 && digits.length <= 15;
}

export function LeadCaptureForm({ remainingCount, isAlertMode: isAlertModeProp, isStrategicMode, onSubmit }: LeadCaptureFormProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [countryCode, setCountryCode] = useState("55");
  const [cidadeEstado, setCidadeEstado] = useState("");
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
    if (!isValidPhone(telefone, countryCode)) {
      setError(countryCode === "55" ? "Inclua o DDD. Ex: 47 99999-8888" : "Número inválido.");
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = `+${countryCode}${telefone.replace(/\D/g, "")}`;
      
      const extraData = isStrategicMode ? {
        cidade_estado: cidadeEstado.trim(),
        pais_codigo: countryCode,
        tipo_lead: "compra/investimento/consultivo",
        quer_analise: true,
        proximo_passo_sugerido: "analise_daniel"
      } : {};

      const ok = await onSubmit(trimmedNome, normalizedPhone, extraData);
      if (!ok) setError("Não consegui salvar agora. Tente novamente, por favor.");
    } catch {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isAlertMode = isAlertModeProp ?? remainingCount === 0;
  const isContactUnlock = !isAlertMode && !isStrategicMode && remainingCount === 0;

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-md ${
      isStrategicMode 
        ? "border-accent/40 bg-gradient-to-br from-accent/5 via-primary/5 to-accent/10" 
        : "border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10"
    }`}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br ${
          isStrategicMode ? "from-accent to-primary" : "from-primary to-accent"
        }`}>
          <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            {isStrategicMode
              ? "📋 Solicitar análise estratégica"
              : isAlertMode
              ? "🔔 Te aviso quando houver novidades"
              : isContactUnlock
              ? "🔓 Libere o contato direto do anunciante"
              : `🏠 Encontrei ${remainingCount} ${remainingCount === 1 ? "imóvel" : "imóveis"} no seu perfil`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {isStrategicMode ? (
              <>
                Preencha seus dados para <strong className="text-foreground">encaminharmos seu perfil corretamente</strong> para análise estratégica.
              </>
            ) : isAlertMode ? (
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
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          autoComplete="name"
          className="bg-background border-border h-10 text-sm"
          maxLength={80}
        />
        
        <div className="flex gap-2">
          <div className="w-[110px] flex-shrink-0">
            <Select value={countryCode} onValueChange={setCountryCode} disabled={loading}>
              <SelectTrigger className="bg-background border-border h-10 text-[12px] px-2">
                <SelectValue placeholder="DDI" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-[12px]">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="tel"
            placeholder={countryCode === "55" ? "DDD + WhatsApp" : "WhatsApp"}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            disabled={loading}
            autoComplete="tel"
            inputMode="tel"
            className="flex-1 bg-background border-border h-10 text-sm"
            maxLength={20}
          />
        </div>

        {isStrategicMode && (
          <div className="relative">
            <Input
              type="text"
              placeholder="Cidade / Estado"
              value={cidadeEstado}
              onChange={(e) => setCidadeEstado(e.target.value)}
              disabled={loading}
              className="bg-background border-border h-10 text-sm pl-9"
              maxLength={100}
            />
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/60" />
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className={`w-full h-10 font-bold text-sm shadow-md hover:opacity-95 transition-opacity bg-gradient-to-r ${
            isStrategicMode ? "from-accent to-primary" : "from-primary to-accent"
          } text-primary-foreground`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {isStrategicMode ? "Enviando perfil..." : isAlertMode ? "Ativando alerta..." : "Liberando..."}
            </>
          ) : (
            <>
              {isStrategicMode ? <Globe className="w-3.5 h-3.5 mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
              {isStrategicMode ? "Solicitar análise estratégica" : isAlertMode ? "Ativar alerta de novidade" : "Liberar todos os imóveis"}
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          🔒 Seus dados ficam protegidos. {isStrategicMode ? "Organizando seu perfil estratégico." : "Sem spam, prometo. 💛"}
        </p>
      </form>
    </div>
  );
}