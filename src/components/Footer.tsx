import { Bot } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tighter flex items-center">
                <span className="text-primary">Mar</span>
                <span className="text-slate-900">IA</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium text-center md:text-left">
              Inteligência Artificial aplicada ao mercado imobiliário local.
            </p>
          </div>

          <div className="flex gap-10">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Produto</span>
              <a href="#como-funciona" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Como Funciona</a>
              <a href="#anunciar" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Para Anunciantes</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Suporte</span>
              <a href="#faq" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">FAQ</a>
              <a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Privacidade</a>
            </div>
          </div>

        </div>

        <div className="mt-20 pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            © {new Date().getFullYear()} MarIA • Bombinhas, SC
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Status:</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-[9px] font-black text-green-600 border border-green-100 uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              Sistemas Online
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;