import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Bot } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
        scrolled 
          ? "py-3 bg-white/70 backdrop-blur-xl border-border/40 shadow-sm" 
          : "py-5 bg-transparent border-transparent"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter leading-none flex items-center">
              <span className="text-primary">Mar</span>
              <span className="text-slate-900">IA</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Bombinhas • SC</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a 
              key={l.href} 
              href={l.href} 
              className="text-[13px] font-semibold text-slate-600 hover:text-primary transition-colors tracking-wide uppercase"
            >
              {l.label}
            </a>
          ))}
          <Link 
            to="/anuncie" 
            className="text-[13px] font-semibold text-slate-600 hover:text-primary transition-colors tracking-wide uppercase"
          >
            Anunciar
          </Link>
          <div className="w-px h-4 bg-slate-200" />
          <Button 
            asChild 
            size="sm" 
            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 h-10 shadow-xl shadow-slate-200"
          >
            <a href="#experimentar">Entrar</a>
          </Button>
        </nav>

        <button 
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-900" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 p-4 bg-white/95 backdrop-blur-2xl border-b border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-2">
            {links.map((l) => (
              <a 
                key={l.href} 
                href={l.href} 
                onClick={() => setOpen(false)} 
                className="text-sm font-bold text-slate-600 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link 
              to="/anuncie" 
              onClick={() => setOpen(false)} 
              className="text-sm font-bold text-slate-600 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Anunciar
            </Link>
            <Button asChild className="w-full rounded-2xl h-14 text-sm font-bold mt-2">
              <a href="#experimentar" onClick={() => setOpen(false)}>Experimentar Grátis</a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;