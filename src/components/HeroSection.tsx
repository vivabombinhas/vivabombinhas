import { ArrowRight, MessageSquare, MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate("/maria");
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-slate-50">
      {/* Background Image with sophisticated overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2500&auto=format&fit=crop" 
          alt="Bombinhas Aerial View" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent md:block hidden" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white md:hidden block" />
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-primary mb-6 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Inteligência Imobiliária em Bombinhas
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Encontre seu lugar em <span className="text-primary italic">Bombinhas</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              A forma mais leve e inteligente de descobrir o imóvel ideal. Converse com a MarIA e encontre oportunidades que realmente combinam com seu estilo de vida.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleStartChat}
                size="lg" 
                className="h-14 px-8 gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-blue-200 transition-all hover:scale-105"
              >
                Conversar com a MarIA
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-50 transition-all"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Como funciona
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center gap-8 text-slate-400">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">40+</span>
                <span className="text-sm font-medium uppercase tracking-wider">Imobiliárias</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">1.5k+</span>
                <span className="text-sm font-medium uppercase tracking-wider">Imóveis Ativos</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">100%</span>
                <span className="text-sm font-medium uppercase tracking-wider">Bombinhas</span>
              </div>
            </div>
          </div>

          {/* Visual Mockup Section */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/20 max-w-md mx-auto">
              <div className="space-y-6">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-lg max-w-[80%] text-sm font-medium leading-relaxed">
                    Quero um apartamento em Mariscal perto da praia, com piscina e 3 quartos. 🏖️
                  </div>
                </div>

                {/* MarIA Message */}
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none shadow-md border border-slate-100 max-w-[85%]">
                    <p className="text-sm text-slate-800 leading-relaxed">
                      Com certeza! Encontrei 3 opções incríveis em Mariscal que combinam exatamente com o que você busca:
                    </p>
                  </div>
                </div>

                {/* Property Mockup Cards */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-50 hover:border-primary/20 transition-all hover:scale-[1.02]">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=400&fit=crop" alt="Property" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">Edifício Mar de Fora</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" /> Mariscal, Bombinhas
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-primary">R$ 1.250.000</span>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> 3</span>
                          <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> 2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-50 opacity-60 scale-95 translate-y-2 translate-x-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop" alt="Property" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">Residencial Brisa do Mar</h4>
                      <div className="h-4 w-24 bg-slate-100 rounded mt-2 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] z-0" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-tropical-100/50 rounded-full blur-[80px] z-0" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;