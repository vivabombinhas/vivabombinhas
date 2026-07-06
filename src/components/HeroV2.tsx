import { useState } from "react";
import { Search, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { openMariaWhatsapp, type MariaIntent } from "@/lib/maria-whatsapp";

const CHIPS: { emoji: string; label: string; intent: MariaIntent }[] = [
  { emoji: "🏖", label: "Temporada", intent: "temporada" },
  { emoji: "🏠", label: "Aluguel anual", intent: "temporada" },
  { emoji: "🔑", label: "Compra", intent: "compra" },
  { emoji: "📈", label: "Investimento", intent: "investimento" },
];

const STATS = [
  { value: "+20", label: "Imobiliárias parceiras" },
  { value: "+580", label: "Imóveis acompanhados" },
  { value: "100%", label: "Foco em Bombinhas" },
];

export const HeroV2 = () => {
  const [query, setQuery] = useState("");

  const handleSearch = (text?: string) => {
    const msg = (text ?? query).trim();
    openMariaWhatsapp(msg ? `Oi MarIA, ${msg}` : "geral");
  };

  return (
    <section className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden">

      {/* ── Background: foto aérea de Bombinhas com overlay ── */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
          alt="Vista aérea de Bombinhas"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(4,17,31,0.55) 0%, rgba(4,17,31,0.75) 50%, rgba(4,17,31,0.92) 100%)"
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-4xl mx-auto w-full px-4 md:px-6 text-center pt-20 md:pt-24 pb-6 md:pb-8">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/15 bg-white/8 backdrop-blur-md"
        >
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-medium tracking-wide text-white/90">
            Concierge imobiliário inteligente em Bombinhas
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-4 md:mb-6"
        >
          Seu concierge imobiliário<br />
          <span className="italic font-serif text-primary">em Bombinhas.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-lg text-white/90 font-light max-w-xl mx-auto mb-10 leading-relaxed"
        >
          IA, curadoria local e atendimento humano para ajudar turistas e
          investidores a encontrar imóveis em Bombinhas com mais confiança.
        </motion.p>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-2xl mx-auto mb-8"
        >
          <div className="relative flex items-center bg-white rounded-full shadow-2xl shadow-black/20 overflow-hidden p-1.5">
            <div className="flex items-center gap-3 flex-1 pl-5">
              <Search className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">Buscar imóveis em Bombinhas</label>
              <input
                id="hero-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Ex: Casa com piscina no Mariscal para 8 pessoas..."
                aria-label="Buscar imóveis em Bombinhas"
                className="w-full bg-transparent text-slate-800 text-[15px] font-medium outline-none placeholder:text-slate-500"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              className="h-12 px-6 rounded-full bg-primary hover:brightness-110 text-white text-sm font-semibold shrink-0 shadow-lg shadow-primary/25 transition-all"
            >
              <span className="hidden sm:inline mr-2">Perguntar à MarIA</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* ── Chips de modalidade ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSearch(chip.query)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-sm hover:bg-white/20 hover:border-white/40 hover:text-white hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center justify-center gap-0 flex-wrap"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-4 md:px-8 ${i < STATS.length - 1 ? "border-r border-white/15" : ""}`}
            >
              <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/80 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};