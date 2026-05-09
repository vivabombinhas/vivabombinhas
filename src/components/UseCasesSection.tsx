import React from "react";
import { InteractiveChatBox } from "@/components/InteractiveChatBox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Home, Key, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const UseCasesSection = () => {
  return (
    <section id="casos-de-uso" className="section-padding bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container-wide">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <TypingText text="Versatilidade MarIA" className="text-badge text-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-h2 mb-6"
          >
            Um assistente, <span className="text-muted-foreground/60 italic font-serif">múltiplas descobertas.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-subtitle"
          >
            Diferentes fluxos desenhados para cada necessidade, garantindo que você encontre exatamente o que busca em Bombinhas.
          </motion.p>
        </div>

        <Tabs defaultValue="temporada" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="h-auto p-2 bg-white/50 backdrop-blur-xl rounded-full border border-border/40 flex flex-wrap justify-center gap-1 md:gap-2 shadow-premium">
              <TabsTrigger 
                value="temporada" 
                className="px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-500 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 md:gap-3 group"
              >
                <Sun className="h-3.5 w-3.5 md:h-4 md:w-4 group-data-[state=active]:animate-spin-slow" />
                Temporada
              </TabsTrigger>
              <TabsTrigger 
                value="anual" 
                className="px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-500 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 md:gap-3 group"
              >
                <Key className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Aluguel Anual
              </TabsTrigger>
              <TabsTrigger 
                value="compra" 
                className="px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-500 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 md:gap-3 group"
              >
                <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Compra
              </TabsTrigger>
              <TabsTrigger 
                value="interacao" 
                className="px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-500 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 md:gap-3 group"
              >
                <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Interação
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <TabsContent value="temporada" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="space-y-6">
                  <h3 className="text-h2">Aluguel de Temporada</h3>
                  <p className="text-subtitle">
                    Planeje suas férias perfeitas em Bombinhas. A MarIA ajuda você a encontrar casas e apartamentos disponíveis para datas específicas, filtrando por proximidade da praia e comodidades.
                  </p>
                </div>
                <div className="grid gap-4">
                  {["Quero uma casa para o Réveillon em Mariscal.", "Apartamento com 3 quartos para janeiro.", "Tem alguma opção que aceite pet na Lagoinha?"].map((q, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-body font-medium flex items-center gap-4 group hover:bg-white hover:shadow-premium transition-all duration-500">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">0{i+1}</div>
                      "{q}"
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="anual" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="space-y-6">
                  <h3 className="text-h2">Aluguel Anual</h3>
                  <p className="text-subtitle">
                    Buscando morar em Bombinhas? Encontre opções de locação fixa com toda a assistência para entender requisitos, localização e valores médios.
                  </p>
                </div>
                <div className="grid gap-4">
                  {["Preciso de uma casa para aluguel anual no Centro.", "Quais os documentos necessários para alugar?", "Procuro kitnet mobiliada para morar."].map((q, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-body font-medium flex items-center gap-4 group hover:bg-white hover:shadow-premium transition-all duration-500">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">0{i+1}</div>
                      "{q}"
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="compra" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="space-y-6">
                  <h3 className="text-h2">Compra de Imóveis</h3>
                  <p className="text-subtitle">
                    Invista no paraíso. A MarIA filtra as melhores oportunidades de investimento ou moradia própria, conectando você aos melhores corretores e proprietários.
                  </p>
                </div>
                <div className="grid gap-4">
                  {["Quero ver apartamentos à venda na planta em Bombas.", "Procuro cobertura frente mar para investimento.", "Quais bairros têm maior valorização?"].map((q, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-body font-medium flex items-center gap-4 group hover:bg-white hover:shadow-premium transition-all duration-500">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">0{i+1}</div>
                      "{q}"
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="interacao" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="space-y-6">
                  <h3 className="text-h2">Interação Amigável</h3>
                  <p className="text-subtitle">
                    Tire dúvidas gerais sobre a cidade, melhores épocas para visita, custo de vida ou como funciona a nossa plataforma.
                  </p>
                </div>
                <div className="grid gap-4">
                  {["Qual a melhor época para evitar filas?", "Como funciona a Taxa de Preservação (TPA)?", "Quais as melhores praias para ir com crianças?"].map((q, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-body font-medium flex items-center gap-4 group hover:bg-white hover:shadow-premium transition-all duration-500">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">0{i+1}</div>
                      "{q}"
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>

            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] max-w-[400px] bg-white/50 rounded-[32px] border border-border/40 overflow-hidden shadow-2xl">
                <TabsContent value="temporada" className="m-0 h-full">
                  <InteractiveChatBox forcedConvIndex={0} />
                </TabsContent>
                <TabsContent value="anual" className="m-0 h-full">
                  <InteractiveChatBox forcedConvIndex={1} />
                </TabsContent>
                <TabsContent value="compra" className="m-0 h-full">
                  <InteractiveChatBox forcedConvIndex={2} />
                </TabsContent>
                <TabsContent value="interacao" className="m-0 h-full">
                  <InteractiveChatBox forcedConvIndex={3} />
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  );
};

export default UseCasesSection;