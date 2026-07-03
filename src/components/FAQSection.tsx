import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "O que é a MarIA?",
    a: "A MarIA é um concierge imobiliário inteligente focado em Bombinhas. Ela combina IA, curadoria da nossa equipe local e atendimento humano para ajudar turistas e investidores a encontrar imóveis com mais confiança.",
  },
  {
    q: "A MarIA é gratuita?",
    a: "Sim. Conversar com a MarIA para encontrar imóveis em Bombinhas é gratuito.",
  },
  {
    q: "Como os imóveis são selecionados?",
    a: "Os imóveis mostrados vêm de imobiliárias e proprietários parceiros em Bombinhas. Nossa equipe local organiza o cadastro e a IA filtra as opções de acordo com o seu perfil.",
  },
  {
    q: "Preciso me cadastrar para usar?",
    a: "Não é preciso criar conta para começar a conversar. O cadastro pode ser pedido quando fizer sentido, por exemplo para receber contato de um especialista ou avisos de novos imóveis.",
  },
  {
    q: "Como falo com o anunciante ou visito o imóvel?",
    a: "Quando o interesse é concreto, um especialista local do time da MarIA entra em contato para organizar informações, visitas, calls e a negociação junto com a imobiliária ou proprietário responsável pelo imóvel.",
  },
  {
    q: "Os imóveis mostrados estão realmente disponíveis?",
    a: "Trabalhamos com imóveis acompanhados por parceiros locais em Bombinhas e mantemos a base atualizada com a equipe. Ainda assim, disponibilidade e valores podem mudar rapidamente — sempre confirmamos os detalhes antes de qualquer negociação.",
  },
  {
    q: "Recebo aviso quando entrar um imóvel novo compatível?",
    a: "Ao compartilhar seu perfil de busca, a MarIA pode te avisar pelo WhatsApp quando um imóvel compatível for cadastrado na plataforma.",
  },
  {
    q: "Como anuncio meu imóvel?",
    a: "Acesse a seção 'Anunciar' e envie as informações básicas do imóvel. Nossa equipe revisa o cadastro antes de publicar.",
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