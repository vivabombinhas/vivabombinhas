import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PropertyCard {
  titulo: string;
  preco: string;
  unidade: string;
  tipo: string;
  cat: string;
  quartos: number;
  capacidade: string;
  attrs: string[];
}

interface ChatMessage {
  type: "user" | "bot";
  text: string;
  isCard?: boolean;
  card?: PropertyCard;
}

type FlowChip = {
  label: string;
  emoji: string;
  messages: ChatMessage[];
};

// ─── Chat Flows ───────────────────────────────────────────────────────────────
const FLOWS: FlowChip[] = [
  {
    label: "Temporada",
    emoji: "🏖",
    messages: [
      { type: "user", text: "Quero uma casa de temporada em Mariscal perto da praia." },
      { type: "bot",  text: "Claro 😊 Você procura algo para família, grupo de amigos ou casal?" },
      { type: "user", text: "Família — somos 5 pessoas. Até R$ 900/noite." },
      {
        type: "bot", text: "Encontrei 2 opções disponíveis em Mariscal para você:", isCard: true,
        card: { titulo: "Casa Vista Mar · Mariscal", preco: "R$ 880", unidade: "/noite", tipo: "Casa", cat: "Temporada", quartos: 3, capacidade: "5 pessoas", attrs: ["Vista mar", "Piscina", "Wi-Fi"] },
      },
    ],
  },
  {
    label: "Aluguel anual",
    emoji: "🏠",
    messages: [
      { type: "user", text: "Procuro apartamento para morar em Bombinhas o ano todo." },
      { type: "bot",  text: "Topa 🏠 Prefere perto da praia ou no centro? Tem pet?" },
      { type: "user", text: "Perto da praia. Tenho um cachorro." },
      {
        type: "bot", text: "Encontrei um ótimo apartamento pet friendly disponível agora:", isCard: true,
        card: { titulo: "Apto 2 quartos · Bombas", preco: "R$ 2.400", unidade: "/mês", tipo: "Apartamento", cat: "Anual", quartos: 2, capacidade: "Pet friendly", attrs: ["2 quadras da praia", "Garagem", "Ar cond."] },
      },
    ],
  },
  {
    label: "Compra",
    emoji: "🔑",
    messages: [
      { type: "user", text: "Quero comprar uma casa em Bombinhas para morar." },
      { type: "bot",  text: "Qual bairro você prefere? Tem alguma preferência de tamanho ou estilo?" },
      { type: "user", text: "Mariscal. Casa com 3 quartos, até R$ 1,4 mi." },
      {
        type: "bot", text: "Perfeito! Tenho um lançamento que encaixa exatamente no seu perfil:", isCard: true,
        card: { titulo: "Sobrado Mariscal · Lançamento", preco: "R$ 1.250.000", unidade: "", tipo: "Casa", cat: "Compra", quartos: 3, capacidade: "110 m²", attrs: ["Vista mar", "3 suítes", "Varanda gourmet"] },
      },
    ],
  },
  {
    label: "Investimento",
    emoji: "📈",
    messages: [
      { type: "user", text: "Quero investir em imóvel em Bombinhas. Vale a pena?" },
      { type: "bot",  text: "Muito! Mariscal tem alta ocupação no verão. Qual faixa de investimento?" },
      { type: "user", text: "Entre R$ 600k e R$ 900k." },
      {
        type: "bot", text: "Aqui está uma opção com excelente retorno estimado em temporada:", isCard: true,
        card: { titulo: "Casa Mariscal · Alto Retorno", preco: "R$ 780.000", unidade: "", tipo: "Casa", cat: "Investimento", quartos: 3, capacidade: "Retorno ~12% a.a.", attrs: ["Alta ocupação", "Vista mar", "Gestão incluída"] },
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function PropertyCardUI({ card }: { card: PropertyCard }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-md w-full max-w-[270px]">
      {/* Image placeholder with gradient */}
      <div className="relative h-[120px] bg-gradient-to-br from-[#062340] to-[#1a9de0] flex items-end p-2">
        <div className="flex gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-white">{card.tipo}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#38b6ff] text-[#04111f]">{card.cat}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[13px] font-semibold text-slate-900 leading-tight mb-0.5">{card.titulo}</p>
        <p className="text-[11px] text-slate-500 mb-2">📍 Bombinhas, SC</p>
        <p className="text-[16px] font-bold text-[#1a9de0] mb-2 tracking-tight">
          {card.preco}<span className="text-[11px] font-normal text-slate-400">{card.unidade}</span>
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
          <span className="text-[11px] text-slate-600">🛏 {card.quartos} quartos</span>
          <span className="text-[11px] text-slate-600">👥 {card.capacidade}</span>
          {card.attrs.map((a) => (
            <span key={a} className="text-[11px] text-slate-600">✓ {a}</span>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#22c55e] text-white text-[12px] font-medium">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.964-1.405A9.952 9.952 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          Falar no WhatsApp
        </button>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 bg-white rounded-2xl rounded-bl-sm shadow-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}

// ─── Animated Chat ────────────────────────────────────────────────────────────
function InteractiveChat({ flowIndex }: { flowIndex: number }) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const push = (fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay));
  };

  useEffect(() => {
    setVisibleMessages([]);
    setShowTyping(false);
    setInputText("");
    clearAll();

    const messages = FLOWS[flowIndex].messages;
    let delay = 400;

    messages.forEach((msg) => {
      if (msg.type === "user") {
        const text = msg.text;
        // simulate typing in input
        push(() => {
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setInputText(text.slice(0, i));
            if (i >= text.length) clearInterval(interval);
          }, 30);
          timeoutsRef.current.push(interval as unknown as ReturnType<typeof setTimeout>);
        }, delay);
        delay += text.length * 30 + 200;
        // send message
        push(() => {
          setInputText("");
          setVisibleMessages((prev) => [...prev, msg]);
        }, delay);
        delay += 400;
      } else {
        // bot typing
        push(() => setShowTyping(true), delay);
        delay += 1000;
        push(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
        }, delay);
        delay += 600;
      }
    });

    // loop
    push(() => {
      setVisibleMessages([]);
      setInputText("");
    }, delay + 3000);

    return clearAll;
  }, [flowIndex]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [visibleMessages, showTyping]);

  return (
    <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-[400px]" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#1a9de0] to-[#38b6ff] flex items-center justify-center text-base flex-shrink-0">
          ✨
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-900 leading-none">MarIA</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Concierge Imobiliária</p>
        </div>
        <div className="ml-auto flex gap-1">
          {[1,2,3].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200"/>)}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex flex-col gap-2.5 p-4 bg-slate-50 overflow-y-auto" style={{ minHeight: 280, maxHeight: 320 }}>
        {visibleMessages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-2 ${msg.type === "user" ? "items-end" : "items-start"} animate-fade-up`}>
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-snug ${
                msg.type === "user"
                  ? "bg-gradient-to-br from-[#1a9de0] to-[#38b6ff] text-white rounded-br-sm"
                  : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
            {msg.isCard && msg.card && <PropertyCardUI card={msg.card} />}
          </div>
        ))}
        {showTyping && (
          <div className="flex items-start animate-fade-up">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-t border-slate-100">
        <input
          readOnly
          value={inputText}
          placeholder="Pergunte sobre Bombinhas…"
          className="flex-1 text-[13px] text-slate-700 placeholder:text-slate-400 bg-transparent outline-none border-none"
        />
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a9de0] to-[#38b6ff] flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 transition-transform">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── WhatsApp Notification Badge ──────────────────────────────────────────────
function WaBadge() {
  return (
    <div
      className="absolute top-0 right-0 z-20 bg-white rounded-2xl p-3.5 shadow-xl animate-fade-up"
      style={{
        maxWidth: 252,
        transform: "translate(24px, -28px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.05)",
        animationDelay: "1.2s",
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-[#22c55e] flex items-center justify-center text-sm flex-shrink-0">📱</div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#22c55e]">WhatsApp · MarIA</p>
          <p className="text-[12px] font-semibold text-slate-900 leading-tight">Novo imóvel no seu perfil</p>
        </div>
      </div>
      <p className="text-[11.5px] text-slate-600 leading-relaxed mb-2">
        Casa em Mariscal · 3 quartos · R$ 890/noite — acabou de entrar no sistema.
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Agora mesmo</span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-[#1a9de0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a9de0] animate-pulse" />
          Notificação em tempo real
        </span>
      </div>
    </div>
  );
}

// ─── Main HeroSection ─────────────────────────────────────────────────────────
export default function HeroSection() {
  const [activeFlow, setActiveFlow] = useState(0);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* ── Background ── */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient — ocean deep */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #04111f 0%, #062340 45%, #083660 70%, #0a4a7a 100%)" }} />
        {/* Mesh glow */}
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse 70% 55% at 65% 35%, rgba(56,182,255,0.7) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 85% 75%, rgba(26,157,224,0.4) 0%, transparent 50%)" }} />
        {/* Subtle horizontal lines — water ripple feel */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(56,182,255,0.5) 28px, rgba(56,182,255,0.5) 29px)", maskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
      </div>

      {/* ── Content grid ── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 max-w-7xl mx-auto w-full px-6 lg:px-12 pt-24 pb-10">

        {/* ── LEFT ── */}
        <div className="flex flex-col animate-fade-up">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start mb-7 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-sm text-white/80 text-[12px] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38b6ff] shadow-[0_0_6px_rgba(56,182,255,0.8)]" />
            Inteligência Imobiliária em Bombinhas
          </div>

          {/* Headline */}
          <h1 className="font-bold leading-[1.05] tracking-tight text-white mb-5" style={{ fontSize: "clamp(38px, 4vw, 58px)" }}>
            A concierge<br />imobiliária<br />inteligente de{" "}
            <span className="italic" style={{ background: "linear-gradient(90deg, #1a9de0, #38b6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Bombinhas
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/75 text-[15px] leading-relaxed font-light max-w-[440px] mb-8">
            Aluguel de temporada, anual, compra ou investimento — a MarIA entende o que você precisa e mostra apenas imóveis que fazem sentido para o seu perfil.
          </p>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {FLOWS.map((flow, i) => (
              <button
                key={i}
                onClick={() => setActiveFlow(i)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] border transition-all duration-200 ${
                  activeFlow === i
                    ? "bg-[#38b6ff] border-[#38b6ff] text-[#04111f] font-medium shadow-[0_4px_16px_rgba(56,182,255,0.35)]"
                    : "bg-white/8 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/40 hover:text-white"
                }`}
              >
                <span>{flow.emoji}</span>
                <span>{flow.label}</span>
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <Button
              size="lg"
              className="flex items-center gap-2 rounded-full px-6 text-[14px] font-medium text-[#04111f] border-0"
              style={{ background: "#38b6ff", boxShadow: "0 8px 32px rgba(56,182,255,0.35)" }}
            >
              <MessageCircle size={15} />
              Conversar com a MarIA
              <ArrowRight size={14} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 text-[14px] font-medium text-white/80 border-white/25 bg-transparent hover:bg-white/10 hover:text-white hover:border-white/50"
            >
              Como funciona
            </Button>
          </div>

          {/* Stats — single row */}
          <div className="flex items-center gap-0 flex-wrap">
            {[
              { num: "+20",  label: "Imobiliárias parceiras" },
              { num: "+580", label: "Imóveis cadastrados" },
              { num: "100%", label: "Foco em Bombinhas" },
            ].map((stat, i, arr) => (
              <div key={i} className={`pr-6 mr-6 ${i < arr.length - 1 ? "border-r border-white/20" : ""}`}>
                <p className="text-[22px] font-semibold text-white tracking-tight leading-none">
                  <span className="text-[#38b6ff]">{stat.num.replace(/[0-9]/g, "")}</span>
                  {stat.num.replace(/\D/g, "")}
                  {stat.num.endsWith("%") ? <span className="text-[#38b6ff]">%</span> : ""}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Chat + WA badge ── */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <WaBadge />
          <InteractiveChat flowIndex={activeFlow} />
        </div>

      </div>
    </section>
  );
}