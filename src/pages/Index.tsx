import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PartnerLogos from "@/components/PartnerLogos";
import FloatingChatButton from "@/components/FloatingChatButton";
import ProblemSection from "@/components/ProblemSection";
import InteractiveDemo from "@/components/InteractiveDemo";
import HowItWorksSection from "@/components/HowItWorksSection";
import AudienceSection from "@/components/AudienceSection";
import BenefitsSection from "@/components/BenefitsSection";
import PartnersSection from "@/components/PartnersSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import FutureSection from "@/components/FutureSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PartnerLogos />
      <ProblemSection />
      <InteractiveDemo />
      <HowItWorksSection />
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
