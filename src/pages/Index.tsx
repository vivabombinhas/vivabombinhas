import Navbar from "@/components/Navbar";
import { LandingAccordionItem } from "@/components/ui/interactive-image-accordion";
import StatsSection from "@/components/StatsSection";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import AudienceSection from "@/components/AudienceSection";
import BenefitsSection from "@/components/BenefitsSection";
import PartnersSection from "@/components/PartnersSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import FutureSection from "@/components/FutureSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FloatingChatButton from "@/components/FloatingChatButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />
      <UseCasesSection />
      <StatsSection />
      <ProblemSection />
      <HowItWorksSection />
      <UseCasesSection />
      <AudienceSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PartnersSection />
      <FutureSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingChatButton />
    </div>
  );
};

export default Index;