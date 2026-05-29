import { MessageSquare, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { PropertyCard, type Property } from "./maria/PropertyCard";

const CONVERSATIONS = [
  {
    id: "temporada",
    messages: [
      { type: "user", text: "Busco uma casa no Mariscal para passar as férias em família." },
      { type: "ai", text: "Olá! Sou a MarIA. 😊 Encontrei uma excelente opção para o seu perfil no Mariscal." },
      { type: "user", text: "Legal, somos 6 pessoas." },
      { type: "ai", text: "Perfeito. Esta casa acomoda bem o seu grupo e fica pertinho da praia. 👇",
        properties: [
          {
            id: "temp-1",
            titulo: "Casa Mariscal - Familiar",
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
    id: "compra",
    messages: [
      { type: "user", text: "Gostaria de ver apartamentos para morar em Bombinhas." },
      { type: "ai", text: "Olá! Bombinhas é um ótimo lugar para viver. Qual região você prefere?" },
      { type: "user", text: "Pode ser em Bombas ou no Centro." },
      { type: "ai", text: "Entendi. Selecionei este apartamento pronto para morar que pode te interessar. 👇",
        properties: [
          {
            id: "compra-1",
            titulo: "Residencial Bombas",
            preco: 1250000,
            bairro: "Bombas",
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
    id: "investimento",
    messages: [
      { type: "user", text: "Busco opções de investimento em imóveis aqui em Bombinhas." },
      { type: "ai", text: "Olá! Posso ajudar com a sua análise de mercado. Você prefere imóveis prontos ou em construção?" },
      { type: "user", text: "Prefiro lançamentos no Mariscal." },
      { type: "ai", text: "Excelente escolha. Tenho este lançamento que se encaixa bem no perfil de busca. 👇",
        properties: [
          {
            id: "invest-1",
            titulo: "Lançamento Mariscal",
            preco: 780000,
            bairro: "Mariscal",
            tipo: "apartamento",
            finalidade: "compra",
            quartos: 2,
            fotos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
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
    <div className="w-full h-full relative flex flex-col">
      <motion.div 
        className="relative flex-1 flex flex-col rounded-[32px] border border-border/40 bg-white shadow-none overflow-hidden"
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
                <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-[0.1em] leading-none">
                  Online agora
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-transparent py-[24px] px-[24px] my-0 mx-0 mr-0"
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

      </motion.div>
    </div>
  );
};