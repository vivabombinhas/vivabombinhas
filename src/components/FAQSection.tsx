import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "A MarIA é um serviço gratuito?",
    a: "Sim. Você pode realizar consultas e navegar pela curadoria da MarIA sem custos iniciais. Nossa missão é facilitar o encontro entre investidores e as melhores oportunidades de Bombinhas.",
  },
  {
    q: "De onde vêm os dados dos imóveis?",
    a: "Nossa IA processa informações em tempo real de centenas de fontes: imobiliárias parceiras, portais especializados e lançamentos exclusivos que muitas vezes não chegam ao mercado aberto.",
  },
  {
    q: "Preciso realizar algum cadastro?",
    a: "Não há necessidade de contas ou senhas. A interação é fluida e direta, permitindo que você comece sua busca em segundos.",
  },
  {
    q: "A MarIA substitui o corretor de imóveis?",
    a: "Pelo contrário, ela o potencializa. A MarIA realiza a triagem pesada e conecta você a um corretor concierge altamente especializado para conduzir a negociação com segurança.",
  },
  {
    q: "A ferramenta é exclusiva para Bombinhas?",
    a: "No momento, focamos nossa inteligência exclusivamente na península de Bombinhas para garantir o mais alto nível de precisão e curadoria local.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 md:py-32 bg-white">
      <div className="container max-w-3xl px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
          >
            Suporte e Informação
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900"
          >
            Dúvidas Frequentes
          </motion.h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-slate-100 rounded-[24px] px-8 bg-slate-50/30 overflow-hidden">
                <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline py-6 text-lg tracking-tight">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 leading-relaxed pb-6 font-medium text-[15px]">
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