import { Bot } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-20 border-t border-slate-100">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2 font-bold text-xl group cursor-pointer" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-primary">Mar</span>
              <span className="text-slate-900">IA</span>
            </div>
            <p className="text-sm text-slate-400 font-medium max-w-[280px] text-center md:text-left leading-relaxed">
              Redefinindo a curadoria imobiliária em Bombinhas com inteligência artificial de alto padrão.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex gap-10 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <a href="#como-funciona" className="hover:text-primary transition-colors">Processo</a>
              <a href="#para-quem" className="hover:text-primary transition-colors">Segmentos</a>
              <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            </div>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em]">
            © {new Date().getFullYear()} MarIA — Bombinhas, Santa Catarina. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em]">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Termos</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;