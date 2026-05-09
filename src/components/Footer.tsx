import { Bot } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-24 bg-background border-t border-border">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
          
          <div className="flex flex-col items-start gap-6 max-w-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-foreground flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-[-0.05em] text-foreground">
                Mar<span className="text-primary">IA</span>
              </span>
            </div>
            <p className="text-body">
              Simplificando a busca imobiliária em Bombinhas através de inteligência artificial e curadoria real.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-16">
            <div className="flex flex-col gap-6">
              <span className="text-badge">Produto</span>
              <div className="flex flex-col gap-4">
                <a href="#como-funciona" className="text-body !text-[13px] hover:text-primary transition-colors">Como Funciona</a>
                <a href="/anuncie" className="text-body !text-[13px] hover:text-primary transition-colors">Anunciar</a>
                <a href="#demo" className="text-body !text-[13px] hover:text-primary transition-colors">Demonstração</a>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <span className="text-badge">Suporte</span>
              <div className="flex flex-col gap-4">
                <a href="#faq" className="text-body !text-[13px] hover:text-primary transition-colors">FAQ</a>
                <a href="#" className="text-body !text-[13px] hover:text-primary transition-colors">Privacidade</a>
                <a href="#" className="text-body !text-[13px] hover:text-primary transition-colors">Contato</a>
              </div>
            </div>
            <div className="hidden md:flex flex-col gap-6">
              <span className="text-badge">Localização</span>
              <p className="text-body !text-[13px]">
                Bombinhas, SC<br />
                Brasil
              </p>
            </div>
          </div>

        </div>

        <div className="mt-24 pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-badge">
            © {new Date().getFullYear()} MarIA • Tecnologia Imobiliária
          </p>
          <div className="flex items-center gap-4">
            <span className="text-badge">Status</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
              Sistemas Operacionais
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;