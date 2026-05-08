import { MessageSquare, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { PropertyCard, type Property } from "./maria/PropertyCard";

const CONVERSATIONS = [
  {
    id: "temporada",
    messages: [
      { type: "user", text: "Quero uma casa para temporada em Mariscal perto da praia." },
      { type: "ai", text: "Claro 😊 Você procura algo mais para família, grupo de amigos ou casal?" },
      { type: "user", text: "Família." },
      { type: "ai", text: "Perfeito. Para quantas pessoas seria? E qual faixa de valor por diária você pretende investir?" },
      { type: "user", text: "5 pessoas. Até R$ 600 por diária." },
      { 
        type: "ai", 
        text: "Encontrei algumas opções muito alinhadas ao que você procura em Mariscal 👇",
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
            anunciante_telefone: "47999999999",
            piscina: true,
            churrasqueira: true
          },
          {
            id: "temp-2",
            titulo: "Sobrado Moderno Mariscal",
            preco_temporada_diaria: 580,
            bairro: "Mariscal",
            tipo: "casa",
            finalidade: "temporada",
            quartos: 2,
            capacidade_pessoas: 5,
            fotos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
            anunciante_telefone: "47999999999",
            ar_condicionado: true,
            wifi: true
          }
        ]
      }
    ]
  },
  {
    id: "aluguel",
    messages: [
      { type: "user", text: "Tem casas para aluguel anual em Bombinhas?" },
      { type: "ai", text: "Sim 😊 Encontrei diversas opções disponíveis para aluguel anual." },
      { type: "ai", text: "Você prefere qual região? Bombas, Centro, Mariscal, Canto Grande ou Zimbros?" },
      { type: "user", text: "Bombas." },
      { 
        type: "ai", 
        text: "Perfeito. Encontrei ótimas opções em Bombas para aluguel anual 👇",
        properties: [
          {
            id: "anual-1",
            titulo: "Apartamento Solar das Bombas",
            preco: 3200,
            bairro: "Bombas",
            tipo: "apartamento",
            finalidade: "aluguel_anual",
            quartos: 2,
            vagas_garagem: 1,
            area_m2: 70,
            fotos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],
            anunciante_telefone: "47999999999",
            mobiliado: true
          }
        ]
      }
    ]
  },
  {
    id: "compra",
    messages: [
      { type: "user", text: "Quero comprar apartamento em Bombinhas para investir." },
      { type: "ai", text: "Ótima escolha 😊 Bombinhas possui regiões com excelente rentabilidade para temporada." },
      { type: "ai", text: "Você procura algo: perto da praia, alto padrão, mais valorização ou melhor custo-benefício?" },
      { type: "user", text: "Mais valorização." },
      { 
        type: "ai", 
        text: "Então vou priorizar regiões muito procuradas para temporada como Mariscal e Bombas 👇",
        properties: [
          {
            id: "compra-1",
            titulo: "Lançamento Premium Mariscal",
            preco: 1250000,
            bairro: "Mariscal",
            tipo: "apartamento",
            finalidade: "compra",
            quartos: 3,
            suites: 3,
            area_m2: 110,
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
      const delay = currentIndex === 0 ? 1500 : 2500;
      
      const typingTimer = setTimeout(() => {
        if (msg.type === 'ai') setIsTyping(true);
        
        const deliverTimer = setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, msg]);
          setCurrentIndex((prev) => prev + 1);
        }, msg.type === 'ai' ? 1800 : 800);

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
    <div className="relative w-full max-w-md mx-auto lg:max-w-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[32px] md:rounded-[40px] border border-border/40 bg-white/90 backdrop-blur-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-secondary/30 p-4 md:p-6 border-b border-border/40 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            </div>
            <div>
              <h4 className="font-bold text-sm md:text-base tracking-tight text-slate-900">MarIA</h4>
              <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Concierge Imobiliária
              </span>
            </div>
          </div>
          <div className="flex gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-border/60" />
             <div className="w-1.5 h-1.5 rounded-full bg-border/60" />
             <div className="w-1.5 h-1.5 rounded-full bg-border/60" />
          </div>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollContainerRef}
          className="h-[350px] md:h-[450px] overflow-y-auto p-5 md:p-8 space-y-5 md:space-y-6 bg-gradient-to-b from-transparent to-slate-50/50 scrollbar-hide"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx + msg.text}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3.5 md:p-4 shadow-sm ${
                    msg.type === 'user' 
                      ? 'bg-primary text-white rounded-2xl rounded-tr-none' 
                      : 'bg-white border border-border/40 rounded-2xl rounded-tl-none text-foreground'
                  }`}
                >
                  <p className="text-[13px] md:text-[15px] leading-relaxed font-medium">
                    {msg.text}
                  </p>

                  {msg.properties && (
                    <div className="mt-4 space-y-4 max-w-[240px] md:max-w-[280px]">
                      {msg.properties.map((prop: Property) => (
                        <motion.div 
                          key={prop.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
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
              <div className="bg-white border border-border/40 rounded-2xl rounded-tl-none p-3 md:p-4 flex gap-1">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }} className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 border-t border-border/40 bg-white/50 backdrop-blur-md">
          <div className="flex gap-3">
            <div className="flex-1 bg-secondary/50 border border-border/30 rounded-full px-5 md:px-6 py-2.5 md:py-3 text-[12px] md:text-sm text-muted-foreground/60 font-medium flex items-center">
              Pergunte sobre Bombinhas...
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 transition-transform cursor-pointer">
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Alert Badge */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute -bottom-6 right-2 md:-bottom-8 md:-right-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-primary/10 p-4 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-[220px] md:w-[280px] z-30"
      >
        <div className="flex items-center gap-3 mb-2 md:mb-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
          <div>
            <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.1em] block">Notificação Real</span>
            <span className="text-[12px] md:text-[14px] font-bold text-foreground">Aviso no WhatsApp</span>
          </div>
        </div>
        <p className="text-[11px] md:text-[12px] text-muted-foreground leading-relaxed font-medium">
          "Oi! Sou a MarIA. Encontrei 3 novas opções em Mariscal que acabaram de entrar."
        </p>
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-[9px] md:text-[10px] text-muted-foreground">Agora mesmo</span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-green-600">Simulação Real</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
