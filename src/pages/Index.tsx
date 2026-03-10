import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import AudienceSection from "@/components/AudienceSection";
import BenefitsSection from "@/components/BenefitsSection";
import PartnersSection from "@/components/PartnersSection";
import FutureSection from "@/components/FutureSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <AudienceSection />
      <BenefitsSection />
      <PartnersSection />
      <FutureSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
