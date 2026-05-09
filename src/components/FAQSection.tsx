import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "A MarIA é gratuita?",
    a: "Sim. O uso da MarIA para encontrar imóveis é totalmente gratuito para quem busca seu lugar em Bombinhas.",
  },
  {
    q: "Como os imóveis são selecionados?",
    a: "Nossa tecnologia analisa bases de dados locais e anúncios verificados para garantir que você receba apenas opções reais.",
  },
  {
    q: "Preciso de cadastro?",
    a: "Não é necessário criar conta. Você pode iniciar uma conversa agora mesmo e receber sugestões instantâneas.",
  },
  {
    q: "Como falo com o anunciante?",
    a: "Nós conectamos você diretamente ao link original ou ao contato do responsável pelo imóvel de forma fluida.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container-wide max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <TypingText text="Dúvidas" className="text-badge text-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-h2"
          >
            Perguntas Frequentes
          </motion.h2>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-3xl px-8 bg-muted/20 overflow-hidden transition-all duration-500 data-[state=open]:bg-white data-[state=open]:shadow-premium">
                <AccordionTrigger className="text-left text-lg font-bold text-foreground hover:no-underline py-6">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-subtitle pb-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;