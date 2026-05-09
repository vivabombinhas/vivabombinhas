import { Bot } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-24 bg-background border-t border-border/50">
      <div className="container-wide">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
          
          <div className="flex flex-col items-start gap-8 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Mar<span className="text-primary italic">IA</span>
              </span>
            </div>
            <p className="text-body max-w-xs">
              Redefinindo a experiência imobiliária em Bombinhas com tecnologia elegante e curadoria local.
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