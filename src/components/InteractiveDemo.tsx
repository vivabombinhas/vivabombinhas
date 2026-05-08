import { MessageSquare, Sparkles, Send, MapPin, Home, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const InteractiveDemo = () => {
  return (
    <section className="py-24 md:py-40 relative overflow-hidden bg-background">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent blur-[120px]" />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Content */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles className="h-4 w-4" />
              Experiência MarIA
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
              Do caos à <span className="italic font-serif text-primary">clareza</span> em segundos.
            </h2>
            
            <p className="text-muted-foreground text-xl font-light leading-relaxed mb-10">
              Esqueça as dezenas de abas abertas. Converse com a MarIA como se estivesse falando com um amigo que conhece cada esquina de Bombinhas.
            </p>

            <ul className="space-y-6">
              {[
                "Busca inteligente em múltiplos bancos de dados",
                "Filtros sensíveis ao seu estilo de vida",
                "Acesso exclusivo a imóveis 'off-market'"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-foreground/80 font-medium text-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Interactive UI Mockup */}
          <div className="relative">
            {/* The "Chat" Window */}
            <div className="rounded-[32px] border border-border/50 bg-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] overflow-hidden animate-fade-up">
              {/* Header */}
              <div className="bg-secondary/50 p-6 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">MarIA Bombinhas</h4>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online agora
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Body */}
              <div className="p-8 space-y-8 bg-slate-50/30">
                {/* User Message */}
                <div className="flex justify-end animate-fade-up" style={{ animationDelay: "200ms" }}>
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-4 max-w-[80%] shadow-sm">
                    <p className="text-sm font-medium">Estou buscando uma casa em Bombas, perto do mar, com 3 quartos e que seja boa para aluguel de temporada. O que você tem?</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start animate-fade-up" style={{ animationDelay: "600ms" }}>
                  <div className="bg-white border border-border/50 rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-sm">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Excelente escolha! Bombas é muito procurada para rentabilidade. Encontrei <span className="text-foreground font-bold italic">3 oportunidades</span> que se encaixam perfeitamente. Veja esta que se destaca:
                    </p>
                    
                    {/* Property Card Preview */}
                    <div className="mt-4 rounded-xl border border-border/40 overflow-hidden bg-slate-50/50">
                      <div className="h-32 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80')] bg-cover bg-center" />
                      <div className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-xs">Casa Mar de Fora - Bombas</h5>
                          <span className="text-primary font-bold text-xs text-nowrap">R$ 1.250.000</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          200m da praia
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <Home className="h-3 w-3" />
                          3 Suítes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="pt-4 border-t border-border/50 flex gap-3">
                  <div className="flex-1 bg-secondary rounded-full px-4 py-2 text-xs text-muted-foreground/60 flex items-center">
                    Pergunte mais detalhes...
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Send className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 md:-right-12 bg-white rounded-2xl border border-border/50 p-4 shadow-xl animate-float max-w-[200px] hidden md:block">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-[10px] font-bold text-foreground">Lead Qualificado</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Corretor avisado via WhatsApp em 0.8s</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;