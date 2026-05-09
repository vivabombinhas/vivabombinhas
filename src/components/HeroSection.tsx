import React, { useState, useEffect } from 'react';
import { InteractiveChatBox } from '@/components/InteractiveChatBox';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquare, Info } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const flowItems = [
  {
    id: 0,
    title: 'Aluguel de Temporada',
    description: 'Encontre a casa ideal para suas férias.',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: 1,
    title: 'Aluguel Anual',
    description: 'More no paraíso com contratos de longo prazo.',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: 2,
    title: 'Compra de Imóveis',
    description: 'Invista no mercado que mais cresce na região.',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: 3,
    title: 'Dúvidas e Preços',
    description: 'Pergunte sobre Bombinhas e valores médios.',
    icon: <Info className="w-5 h-5" />,
  },
];

export function HeroSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="relative min-h-[90vh] lg:min-h-[85vh] flex flex-col justify-center overflow-hidden pt-32 pb-16 lg:pt-24 lg:pb-20 bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.03),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr,1.1fr] items-center gap-12 lg:gap-20">
          
          {/* Content Side */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 mb-8 lg:mb-10 px-4 py-2 rounded-full border border-border bg-background/50 backdrop-blur-sm shadow-sm"
            >
              <div className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-pulse shrink-0" />
              <span className="text-badge font-medium">
                Assistente Imobiliária Inteligente
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-foreground text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 lg:mb-8" 
            >
              Converse com a MarIA e encontre o <span className="text-primary italic">imóvel certo</span>.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-muted-foreground text-lg md:text-xl max-w-[540px] mb-10 lg:mb-12 leading-relaxed"
            >
              Diga o que você busca e nossa IA vasculha os melhores anúncios de Bombinhas para você. Simples, direto e sem perda de tempo.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="h-14 lg:h-16 px-10 rounded-2xl bg-foreground text-white font-bold hover:bg-slate-800 transition-all duration-500 shadow-xl group"
                onClick={() => window.open('https://wa.me/5547999999999', '_blank')}
              >
                Começar Conversa
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-500" />
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 px-4 py-2 cursor-help text-muted-foreground hover:text-foreground transition-colors">
                      <div className="p-2 rounded-full bg-muted">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold">Como funciona?</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-4 rounded-xl bg-popover border-border shadow-2xl">
                    <p className="text-sm leading-relaxed">A MarIA entende linguagem natural. Você pode pedir por preço, localização ou características específicas do imóvel.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          </div>

          {/* Interactive Carousel Side */}
          <div className="w-full relative px-4 lg:px-0">
            <div className="absolute -inset-4 bg-primary/5 rounded-[40px] blur-3xl z-0" />
            
            <div className="relative z-10 flex flex-col gap-8">
              {/* Carousel for Flow Selection */}
              <Carousel 
                setApi={setApi} 
                className="w-full"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent className="-ml-4">
                  {flowItems.map((item, index) => (
                    <CarouselItem key={item.id} className="pl-4 basis-full md:basis-1/2 lg:basis-full">
                      <motion.div 
                        initial={false}
                        animate={{ 
                          scale: current === index ? 1 : 0.95,
                          opacity: current === index ? 1 : 0.6
                        }}
                        className={`relative h-[520px] rounded-3xl overflow-hidden border transition-all duration-500 bg-background ${
                          current === index ? 'border-primary/20 ring-4 ring-primary/5 shadow-2xl' : 'border-border'
                        }`}
                      >
                        {/* Flow Header Badge */}
                        <div className="absolute top-6 left-6 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm">
                          <div className="text-primary">{item.icon}</div>
                          <span className="text-xs font-bold uppercase tracking-wider">{item.title}</span>
                        </div>

                        {/* Chat Box Instance */}
                        <div className="w-full h-full p-2 pt-16">
                          <InteractiveChatBox forcedConvIndex={index} />
                        </div>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                
                {/* Custom Carousel Controls */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex gap-2">
                    {flowItems.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => api?.scrollTo(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          current === i ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full w-12 h-12 border-border hover:bg-muted"
                      onClick={() => api?.scrollPrev()}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full w-12 h-12 border-border hover:bg-muted"
                      onClick={() => api?.scrollNext()}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
