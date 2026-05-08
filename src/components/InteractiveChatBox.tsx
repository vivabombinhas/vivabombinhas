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
    <div className="w-full relative">
      <motion.div 
        className="relative rounded-[40px] border border-slate-100 bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12)] overflow-hidden"
      >
        {/* Header: More refined and application-like */}
        <div className="bg-slate-50/50 backdrop-blur-md p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-[15px] tracking-tight text-slate-950 leading-none mb-2">MarIA</h4>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] leading-none">
                  Sempre pronta
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollContainerRef}
          className="h-[300px] xs:h-[340px] md:h-[420px] overflow-y-auto p-5 md:p-8 space-y-5 md:space-y-6 scrollbar-hide bg-white/50"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx + msg.text}
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[88%] p-4 rounded-2xl md:rounded-[22px] ${
                    msg.type === 'user' 
                      ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' 
                      : 'bg-white border border-slate-100 text-slate-700 shadow-sm'
                  }`}
                >
                  <p className="text-[14px] md:text-[15px] leading-relaxed font-medium">
                    {msg.text}
                  </p>

                  {msg.properties && (
                    <div className="mt-5 space-y-4 w-[200px] md:w-[280px]">
                      {msg.properties.map((prop: Property) => (
                        <div key={prop.id} className="scale-[0.85] md:scale-95 origin-top-left -mb-8 md:-mb-6 last:mb-0">
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
              <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Fake Input Area: Clean & Professional */}
        <div className="p-5 bg-white border-t border-slate-100">
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[13px] text-slate-400 font-medium flex items-center">
              Como posso ajudar hoje?
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-lg shadow-slate-100">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};