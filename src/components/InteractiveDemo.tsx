import { MessageSquare, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
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

const InteractiveDemo = () => {
  const [currentConvIndex, setCurrentConvIndex] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const currentConv = CONVERSATIONS[currentConvIndex];

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
        }, msg.type === 'ai' ? 1500 : 500);

        return () => clearTimeout(deliverTimer);
      }, delay);

      return () => clearTimeout(typingTimer);
    } else {
      const nextConvTimer = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
        setCurrentConvIndex((prev) => (prev + 1) % CONVERSATIONS.length);
      }, 6000);
      return () => clearTimeout(nextConvTimer);
    }
  }, [currentIndex, currentConvIndex]);

  return (
    <section className="py-12 md:py-20 relative overflow-hidden bg-background">
      {/* Background patterns - Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.05] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-accent blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left: Content */}
          <div className="max-w-xl order-2 lg:order-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-8 border border-primary/10"
            >
              <Sparkles className="h-4 w-4" />
              Experiência MarIA
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight leading-[1.1]"
            >
              A inteligência que <span className="italic font-serif text-primary underline decoration-primary/20 underline-offset-8">entende</span> seu desejo.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed mb-10"
            >
              Mais que um robô, uma concierge digital. A MarIA filtra, qualifica e entrega apenas o que faz sentido para sua vida ou investimento.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {[
                "Entende contexto e intenção real",
                "Curadoria humana potencializada por IA",
                "Alertas instantâneos no seu WhatsApp"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-foreground/80 font-medium text-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12"
            >
              <Button size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all">
                Testar experiência agora
              </Button>
            </motion.div>
          </div>

          {/* Right: Animated Chat Mockup */}
          <div className="relative order-1 lg:order-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-[40px] border border-border/40 bg-white/80 backdrop-blur-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-secondary/30 p-6 border-b border-border/40 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base tracking-tight">MarIA</h4>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Concierge Imobiliária
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-border/60" />
                   <div className="w-2 h-2 rounded-full bg-border/60" />
                   <div className="w-2 h-2 rounded-full bg-border/60" />
                </div>
              </div>

              {/* Chat Body */}
              <div className="h-[450px] overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-transparent to-slate-50/50 scrollbar-hide">
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
                        className={`max-w-[85%] p-4 shadow-sm ${
                          msg.type === 'user' 
                            ? 'bg-primary text-white rounded-2xl rounded-tr-none' 
                            : 'bg-white border border-border/40 rounded-2xl rounded-tl-none text-foreground'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed font-medium">
                          {msg.text}
                        </p>

                        {msg.properties && (
                          <div className="mt-4 space-y-4 max-w-[280px]">
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
                    <div className="bg-white border border-border/40 rounded-2xl rounded-tl-none p-4 flex gap-1">
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-border/40 bg-white/50 backdrop-blur-md">
                <div className="flex gap-3">
                  <div className="flex-1 bg-secondary/50 border border-border/30 rounded-full px-6 py-3 text-sm text-muted-foreground/60 font-medium flex items-center">
                    Pergunte sobre Bombinhas...
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 transition-transform cursor-pointer">
                    <Send className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Alert Badge - Replaces "Lead Qualificado" */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="absolute bottom-[15%] -left-8 md:-left-20 bg-white/90 backdrop-blur-xl rounded-[28px] border border-border/40 p-6 shadow-2xl max-w-[260px] hidden md:block z-20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-inner">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block mb-0.5">Alerta Inteligente</span>
                  <span className="text-[14px] font-bold text-foreground">Aviso no WhatsApp</span>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed font-medium mb-4">
                "A MarIA avisa automaticamente quando surgem imóveis parecidos com sua busca."
              </p>
              
              <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Agora mesmo</span>
                <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                  Ativo
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;