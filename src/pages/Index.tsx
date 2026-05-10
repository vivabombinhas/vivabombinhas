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
import StatsSection from "@/components/StatsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />
      <HeroV2 />
      <StatsSection />
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