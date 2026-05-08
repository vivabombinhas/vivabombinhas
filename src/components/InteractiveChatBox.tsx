import { MessageSquare, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { PropertyCard, type Property } from "./maria/PropertyCard";

const CONVERSATIONS = [
  {
    id: "temporada",
    messages: [
      { type: "user", text: "Quero uma casa para temporada em Mariscal perto da praia." },
      { type: "ai", text: "Claro 😊 Procura algo para família ou casal?" },
      { type: "user", text: "Família." },
      { type: "ai", text: "Perfeito. Encontrei estas opções em Mariscal 👇",
        properties: [
          {
            id: "temp-1",
            titulo: "Casa Mariscal - 100m da Praia",
            preco_temporada_diaria: 550,
            bairro: "Mariscal",
            tipo: "casa",
            finalidade: "temporada",
            quartos: 3,
            capacidade_pessoas: 6,
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
      { type: "ai", text: "Sim! Qual sua faixa de valor pretendida?" },
      { type: "user", text: "Até R$ 3.500." },
      { type: "ai", text: "Excelente. Veja este em Bombas 👇",
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
      { type: "ai", text: "Ótima escolha! Busca valorização ou rentabilidade imediata?" },
      { type: "user", text: "Valorização." },
      { type: "ai", text: "Recomendo este lançamento no Mariscal 👇",
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
    <div className="w-full relative group">
      {/* Background glass effect */}
      <div className="absolute inset-0 bg-white/5 rounded-[40px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
      
      <motion.div 
        className="relative rounded-[32px] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-white leading-none mb-1">MarIA</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-none block">
                  IA • ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body - More compact */}
        <div 
          ref={scrollContainerRef}
          className="h-[300px] md:h-[340px] overflow-y-auto p-5 md:p-6 space-y-4 scrollbar-hide"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx + msg.text}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3.5 shadow-sm rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-white text-slate-950 font-semibold' 
                      : 'bg-white/5 border border-white/10 text-white/80'
                  }`}
                >
                  <p className="text-[13px] md:text-[14px] leading-relaxed">
                    {msg.text}
                  </p>

                  {msg.properties && (
                    <div className="mt-4 space-y-3 w-[200px] md:w-[240px]">
                      {msg.properties.map((prop: Property) => (
                        <div key={prop.id} className="scale-90 origin-top-left -mb-4">
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
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex gap-1">
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Fake Input Area */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5">
          <div className="flex gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white/30 font-medium flex items-center">
              Pergunte algo...
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <Send className="h-4 w-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};