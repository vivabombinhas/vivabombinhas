import { MessageSquare, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { PropertyCard, type Property } from "./maria/PropertyCard";

const CONVERSATIONS = [
  {
    id: "temporada",
    messages: [
      { type: "user", text: "Quero uma casa para temporada em Mariscal perto da praia." },
      { type: "ai", text: "Oi! Sou a MarIA 🌊 Tenho ótimas opções no Mariscal. Procura algo para família ou casal?" },
      { type: "user", text: "Família, somos 6 pessoas." },
      { type: "ai", text: "Perfeito. Uma casa espaçosa seria ideal. Encontrei esta opção incrível pé na areia 👇",
        properties: [
          {
            id: "temp-1",
            titulo: "Casa Mariscal - 100m da Praia",
            preco_temporada_diaria: 850,
            bairro: "Mariscal",
            tipo: "casa",
            finalidade: "temporada",
            quartos: 3,
            capacidade_pessoas: 8,
            fotos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"],
            anunciante_telefone: "47999999999"
          }
        ]
      }
    ]
  },
  {
    id: "aluguel",
    messages: [
      { type: "user", text: "Tem apartamentos para aluguel anual em Bombas?" },
      { type: "ai", text: "Olá! Bombas é excelente para morar. Qual sua faixa de valor pretendida?" },
      { type: "user", text: "Até R$ 3.500 com condomínio." },
      { type: "ai", text: "Excelente. Tenho um apartamento mobiliado muito bem localizado 👇",
        properties: [
          {
            id: "anual-1",
            titulo: "Apartamento Solar das Bombas",
            preco: 3200,
            bairro: "Bombas",
            tipo: "apartamento",
            finalidade: "aluguel_anual",
            quartos: 2,
            fotos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],
            anunciante_telefone: "47999999999"
          }
        ]
      }
    ]
  },
  {
    id: "compra",
    messages: [
      { type: "user", text: "Quero investir em um imóvel em Bombinhas." },
      { type: "ai", text: "Bombinhas está em plena valorização! Busca algo pronto ou lançamento?" },
      { type: "user", text: "Lançamento para valorização futura." },
      { type: "ai", text: "Entendi. Este lançamento no Mariscal é a melhor oportunidade hoje 👇",
        properties: [
          {
            id: "compra-1",
            titulo: "Lançamento Premium Mariscal",
            preco: 1250000,
            bairro: "Mariscal",
            tipo: "apartamento",
            finalidade: "compra",
            quartos: 3,
            fotos: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"],
            anunciante_telefone: "47999999999"
          }
        ]
      }
    ]
  },
  {
    id: "duvidas",
    messages: [
      { type: "user", text: "Qual a melhor época para visitar Bombinhas?" },
      { type: "ai", text: "Depende do seu objetivo! Dezembro a Março é o auge do calor e agito ☀️" },
      { type: "user", text: "E os preços? Quero algo mais tranquilo e barato." },
      { type: "ai", text: "Nesse caso, recomendo Abril ou Outubro. As águas continuam mornas e os preços caem até 50%!" },
      { type: "ai", text: "Deseja ver opções de hospedagem para esses meses?" }
    ]
  }
];

export const InteractiveChatBox = ({ 
  forcedConvIndex,
  onConvIndexChange
}: { 
  forcedConvIndex?: number | null;
  onConvIndexChange?: (index: number) => void;
}) => {
  const [currentConvIndex, setCurrentConvIndex] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentConv = CONVERSATIONS[currentConvIndex];

  useEffect(() => {
    if (forcedConvIndex !== undefined && forcedConvIndex !== null) {
      setMessages([]);
      setCurrentIndex(0);
      setCurrentConvIndex(forcedConvIndex);
    }
  }, [forcedConvIndex]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (currentIndex < currentConv.messages.length) {
      const msg = currentConv.messages[currentIndex];
      const delay = currentIndex === 0 ? 1000 : 2000;
      
      const typingTimer = setTimeout(() => {
        if (msg.type === 'ai') setIsTyping(true);
        
        const deliverTimer = setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, msg]);
          setCurrentIndex((prev) => prev + 1);
        }, msg.type === 'ai' ? 1200 : 600);

        return () => clearTimeout(deliverTimer);
      }, delay);

      return () => clearTimeout(typingTimer);
    } else {
      const nextConvTimer = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
        const nextIndex = (currentConvIndex + 1) % CONVERSATIONS.length;
        setCurrentConvIndex(nextIndex);
        onConvIndexChange?.(nextIndex);
      }, 8000);
      return () => clearTimeout(nextConvTimer);
    }
  }, [currentIndex, currentConvIndex]);

  return (
    <div className="w-full h-full relative flex flex-col">
      <motion.div 
        className="relative flex-1 flex flex-col rounded-[32px] border border-border/40 bg-white/40 backdrop-blur-md shadow-none overflow-hidden"
      >
        {/* Header: More refined and application-like */}
        <div className="bg-white/50 backdrop-blur-md px-6 py-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-slate-200">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-base tracking-tight text-foreground leading-none mb-2">MarIA</h4>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.1em] leading-none">
                  Online agora
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-transparent"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx + msg.text}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-5 rounded-2xl md:rounded-[28px] ${
                    msg.type === 'user' 
                      ? 'bg-foreground text-white shadow-lg' 
                      : 'bg-white border border-border/40 text-foreground shadow-sm'
                  }`}
                >
                  <p className="text-[14px] md:text-[15px] leading-relaxed font-medium">
                    {msg.text}
                  </p>

                  {msg.properties && (
                    <div className="mt-6 space-y-4 w-full min-w-[240px] md:min-w-[300px]">
                      {msg.properties.map((prop: Property) => (
                        <div key={prop.id} className="last:mb-0">
                          <PropertyCard property={prop} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-border/40 rounded-2xl px-5 py-4 flex gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Functional Input Area: Redirects to Search */}
        <div className="px-6 py-5 bg-white/50 border-t border-border/40">
          <a 
            href="/search" 
            className="flex gap-4 group transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex-1 bg-white border border-border/60 rounded-2xl px-5 py-4 text-[13px] text-muted-foreground/40 font-bold flex items-center italic group-hover:border-primary/40 transition-colors">
              O que você busca hoje?
            </div>
            <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center text-white shadow-lg group-hover:bg-primary transition-all duration-500">
              <Send className="h-5 w-5" />
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
};