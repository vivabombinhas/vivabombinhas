import { MessageSquare, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { PropertyCard, type Property } from "./maria/PropertyCard";

const CONVERSATIONS = [
  {
    id: "temporada",
    messages: [
      { type: "user", text: "Quero uma casa de luxo para temporada em Mariscal." },
      { type: "ai", text: "Excelente escolha. Mariscal é o refúgio perfeito. 😊 Você procura algo pé na areia para quantas pessoas?" },
      { type: "user", text: "Pé na areia, para 8 pessoas. Orçamento flexível." },
      { type: "ai", text: "Perfeito. Selecionei duas propriedades exclusivas que definem o luxo em Mariscal 👇" },
      { 
        type: "ai", 
        text: "",
        properties: [
          {
            id: "temp-1",
            titulo: "Villa Oceanfront Mariscal",
            preco_temporada_diaria: 4500,
            bairro: "Mariscal",
            tipo: "casa",
            finalidade: "temporada",
            quartos: 4,
            capacidade_pessoas: 10,
            fotos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"],
            anunciante_telefone: "47999999999",
            piscina: true,
            churrasqueira: true
          }
        ]
      }
    ]
  },
  {
    id: "compra",
    messages: [
      { type: "user", text: "Busco cobertura de alto padrão para investimento." },
      { type: "ai", text: "Entendido. Bombinhas está em um momento excelente de valorização. 😊 Qual praia você prefere?" },
      { type: "user", text: "Centro ou Bombas. Quero vista definitiva para o mar." },
      { 
        type: "ai", 
        text: "Encontrei esta oportunidade única em pré-lançamento com a melhor vista da região 👇",
        properties: [
          {
            id: "compra-1",
            titulo: "Lançamento Horizon Premium",
            preco: 3850000,
            bairro: "Centro",
            tipo: "apartamento",
            finalidade: "compra",
            quartos: 4,
            suites: 4,
            area_m2: 180,
            fotos: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"],
            anunciante_telefone: "47999999999",
            destaque_pago: true,
            vista_mar: true
          }
        ]
      }
    ]
  }
];

export const InteractiveChatBox = () => {
  const [currentConvIndex, setCurrentConvIndex] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentConv = CONVERSATIONS[currentConvIndex];

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
        }, msg.type === 'ai' ? 1500 : 800);

        return () => clearTimeout(deliverTimer);
      }, delay);

      return () => clearTimeout(typingTimer);
    } else {
      const nextConvTimer = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
        setCurrentConvIndex((prev) => (prev + 1) % CONVERSATIONS.length);
      }, 8000);
      return () => clearTimeout(nextConvTimer);
    }
  }, [currentIndex, currentConvIndex]);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[40px] border border-white/40 bg-white/40 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white/40 p-6 border-b border-white/20 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            </div>
            <div>
              <h4 className="font-bold text-base tracking-tight text-slate-900">MarIA</h4>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Concierge de Luxo
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 opacity-30">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
             <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
             <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          </div>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollContainerRef}
          className="h-[500px] overflow-y-auto p-8 space-y-6 scrollbar-hide"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx + msg.text}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-4 shadow-sm ${
                    msg.type === 'user' 
                      ? 'bg-primary text-white rounded-2xl rounded-tr-none' 
                      : 'bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl rounded-tl-none text-foreground'
                  }`}
                >
                  {msg.text && (
                    <p className="text-[15px] leading-relaxed font-medium">
                      {msg.text}
                    </p>
                  )}

                  {msg.properties && (
                    <div className="mt-4 space-y-4 w-[280px]">
                      {msg.properties.map((prop: Property) => (
                        <motion.div 
                          key={prop.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <PropertyCard property={prop} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl rounded-tl-none p-4 flex gap-1.5">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/20 bg-white/30 backdrop-blur-md">
          <div className="flex gap-4">
            <div className="flex-1 bg-white/50 border border-white/40 rounded-full px-6 py-3.5 text-sm text-muted-foreground/60 font-medium flex items-center">
              Descreva o seu imóvel ideal...
            </div>
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Notification Badge */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute -bottom-10 -right-12 hidden lg:block bg-white/95 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] w-[300px] z-30"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em] block">Notificação Exclusiva</span>
            <span className="text-[14px] font-bold text-slate-900 leading-none">Alerta WhatsApp</span>
          </div>
        </div>
        <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
          "MarIA: Nova cobertura pé na areia disponível em Mariscal. Exclusividade total."
        </p>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Agora mesmo</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};