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
    <section id="faq" className="py-24 bg-white">
      <div className="container max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4">FAQ</p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950">Dúvidas Frequentes</h2>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-slate-100 rounded-[24px] px-8 bg-slate-50/50 overflow-hidden transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-2xl data-[state=open]:shadow-slate-100">
                <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline py-6">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 font-medium leading-relaxed pb-6">
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