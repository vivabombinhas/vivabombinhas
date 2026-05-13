import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import AudienceSection from "@/components/AudienceSection";
import BenefitsSection from "@/components/BenefitsSection";
import PartnersSection from "@/components/PartnersSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FloatingChatButton from "@/components/FloatingChatButton";
import { HeroV2 } from "@/components/HeroV2";

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "A MarIA é gratuita?", acceptedAnswer: { "@type": "Answer", text: "Sim. O uso da MarIA para encontrar imóveis é totalmente gratuito para quem busca seu lugar em Bombinhas." } },
    { "@type": "Question", name: "Como os imóveis são selecionados?", acceptedAnswer: { "@type": "Answer", text: "Nossa tecnologia analisa bases de dados locais e anúncios verificados para garantir que você receba apenas opções reais." } },
    { "@type": "Question", name: "Preciso de cadastro?", acceptedAnswer: { "@type": "Answer", text: "Não é necessário criar conta. Você pode iniciar uma conversa agora mesmo e receber sugestões instantâneas." } },
    { "@type": "Question", name: "Como falo com o anunciante?", acceptedAnswer: { "@type": "Answer", text: "Nós conectamos você diretamente ao link original ou ao contato do responsável pelo imóvel de forma fluida." } },
    { "@type": "Question", name: "Os imóveis mostrados são reais e disponíveis?", acceptedAnswer: { "@type": "Answer", text: "Sim. Todos os imóveis são verificados e cadastrados por imobiliárias e proprietários em Bombinhas. A MarIA só mostra o que está disponível." } },
    { "@type": "Question", name: "Recebo alertas quando entrar imóvel novo no meu perfil?", acceptedAnswer: { "@type": "Answer", text: "Sim! Ao compartilhar seu perfil de busca, a MarIA te notifica pelo WhatsApp sempre que um imóvel compatível for cadastrado na plataforma." } },
    { "@type": "Question", name: "Como anuncio meu imóvel na plataforma?", acceptedAnswer: { "@type": "Answer", text: "Acesse a seção 'Anunciar', preencha as informações básicas do seu imóvel e nossa equipe ativa o anúncio em até 24 horas." } },
  ],
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Helmet>
        <title>MarIA — Inteligência Imobiliária em Bombinhas</title>
        <meta name="description" content="MarIA é a assistente de IA que entende seu perfil e mostra apenas imóveis reais e disponíveis em Bombinhas — temporada, aluguel anual, compra e investimento." />
        <link rel="canonical" href="https://vivabombinhas.lovable.app/" />
        <meta property="og:title" content="MarIA — Inteligência Imobiliária em Bombinhas" />
        <meta property="og:description" content="Encontre o imóvel certo em Bombinhas com a MarIA: curadoria local e busca por IA para temporada, aluguel anual, compra e investimento." />
        <meta property="og:url" content="https://vivabombinhas.lovable.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(FAQ_JSON_LD)}</script>
      </Helmet>
      <Navbar />
      <HeroV2 />
      <div className="space-y-0">
        <ProblemSection />
        <HowItWorksSection />
        <UseCasesSection />
        <AudienceSection />
        <BenefitsSection />
        <PartnersSection />
        <FAQSection />
        <CTASection />
      </div>
      <Footer />
      <FloatingChatButton />
    </div>
  );
};

export default Index;