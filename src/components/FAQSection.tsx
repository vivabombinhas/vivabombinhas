import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "A MarIA é gratuita?",
    a: "Sim! O uso da MarIA para encontrar imóveis é totalmente gratuito para o usuário final.",
  },
  {
    q: "Como os imóveis são selecionados?",
    a: "Nossa IA analisa bases de dados locais, sites parceiros e anúncios verificados para garantir que você receba apenas opções reais e atualizadas.",
  },
  {
    q: "Preciso de cadastro?",
    a: "Não é necessário criar conta para iniciar uma conversa. Você pode descrever o que busca e receber sugestões instantaneamente.",
  },
  {
    q: "Como falo com o anunciante?",
    a: "Após a curadoria da MarIA, se você se interessar por um imóvel, nós conectamos você diretamente ao WhatsApp do corretor ou imobiliária responsável.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-32 bg-background">
      <div className="container max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-24">
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-badge text-primary mb-6"
          >
            FAQ
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-h2"
          >
            Dúvidas Frequentes
          </motion.h2>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-[32px] px-10 bg-muted/50 overflow-hidden transition-all duration-500 data-[state=open]:bg-background data-[state=open]:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
                <AccordionTrigger className="text-left text-body font-bold text-foreground hover:no-underline py-8">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-body pb-8">
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