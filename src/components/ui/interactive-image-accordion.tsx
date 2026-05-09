import React, { useState } from 'react';
import { InteractiveChatBox } from '@/components/InteractiveChatBox';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const accordionItems = [
  {
    id: 0,
    title: 'Aluguel de Temporada',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 1,
    title: 'Aluguel Anual',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Compra de Imóveis',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Dúvidas e Preços',
    imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=1974&auto=format&fit=crop',
  },
];

const AccordionItem = ({ item, isActive, onMouseEnter }: { item: any; isActive: boolean; onMouseEnter: () => void }) => {
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-700 ease-in-out border border-border/50
        ${isActive ? 'w-full md:w-[450px] h-[500px] md:h-[480px] ring-2 ring-primary/20' : 'w-full md:w-[70px] h-[60px] md:h-[480px] bg-muted/30'}
      `}
      onMouseEnter={onMouseEnter}
      onClick={onMouseEnter}
    >
      {/* Remove heavy background image, use subtle gradient instead */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'bg-background' : 'bg-muted/50'}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.05),transparent)]" />

      <span
        className={`
          absolute font-bold whitespace-nowrap
          transition-all duration-500 ease-in-out
          ${
            isActive
              ? 'top-4 left-6 text-foreground text-sm uppercase tracking-widest opacity-40'
              : 'bottom-24 left-1/2 -translate-x-1/2 rotate-90 text-muted-foreground text-sm'
          }
        `}
      >
        {item.title}
      </span>
    </div>
  );
};

export function LandingAccordionItem() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative min-h-[85vh] lg:min-h-[75vh] flex flex-col justify-center overflow-hidden pt-32 pb-12 lg:pt-24 lg:pb-16 bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.03),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr,1.2fr] items-center gap-12 lg:gap-16">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 mb-8 lg:mb-10 px-4 py-2 rounded-full border border-border bg-background/50 backdrop-blur-sm shadow-sm"
            >
              <div className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-pulse shrink-0" />
              <span className="text-badge whitespace-nowrap overflow-hidden text-ellipsis">
                Assistente Imobiliária • Bombinhas
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-foreground text-h1 mb-6 lg:mb-8" 
            >
              Encontre o imóvel<br />
              certo em <span className="text-primary">Bombinhas</span><br />
              sem complicação.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-subtitle max-w-[520px] mb-10 lg:mb-12"
            >
              A MarIA centraliza anúncios de toda a cidade e filtra o que realmente importa. Converse, explore e conecte-se direto com o anunciante.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="h-14 lg:h-16 px-8 lg:px-10 rounded-2xl bg-foreground text-white font-bold hover:bg-slate-800 transition-all duration-500 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] group"
                onClick={() => window.open('https://wa.me/5547999999999', '_blank')}
              >
                Começar agora
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-500" />
              </Button>
            </motion.div>
          </div>

          <div className="w-full lg:w-3/5">
            <div className="flex flex-col md:flex-row items-stretch justify-center lg:justify-end gap-2 md:gap-4 p-2 min-h-[500px]">
              {accordionItems.map((item, index) => (
                <div key={item.id} className="relative">
                  <AccordionItem
                    item={item}
                    isActive={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                  {index === activeIndex && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 p-0 pointer-events-none"
                    >
                      <div className="w-full h-full pointer-events-auto">
                        <InteractiveChatBox 
                          forcedConvIndex={activeIndex} 
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
