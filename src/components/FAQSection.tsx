import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "MarIA é gratuita?",
    a: "Sim! Você pode testar a MarIA gratuitamente. Basta descrever o imóvel que procura e ela mostra as opções disponíveis na região de Bombinhas.",
  },
  {
    q: "Como a MarIA encontra os imóveis?",
    a: "MarIA busca em diversas fontes públicas da região: sites de imobiliárias, classificados online, redes sociais e outras plataformas. Ela cruza e organiza essas informações para você.",
  },
  {
    q: "Preciso criar conta para usar?",
    a: "Não! Você pode fazer suas primeiras buscas sem nenhum cadastro. Rápido e sem burocracia.",
  },
  {
    q: "A MarIA é uma imobiliária?",
    a: "Não. MarIA é uma assistente de busca inteligente. Ela não vende nem aluga imóveis — ela ajuda você a encontrar anúncios existentes e conecta você diretamente aos anunciantes.",
  },
  {
    q: "MarIA funciona só para Bombinhas?",
    a: "Inicialmente sim. Nosso foco é a região de Bombinhas, Santa Catarina. No futuro, pretendemos expandir para outras regiões e outros tipos de informação local.",
  },
  {
    q: "Posso confiar nos resultados?",
    a: "MarIA sempre fornece links para os anúncios originais, para que você possa verificar as informações diretamente na fonte e entrar em contato com os responsáveis.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28 bg-gradient-to-b from-primary/[0.02] to-transparent">
      <div className="container max-w-2xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold">Perguntas frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-xl px-6 border-none">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;