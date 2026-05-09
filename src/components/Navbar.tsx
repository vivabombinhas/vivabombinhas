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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
        scrolled 
          ? "py-4 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-[0_2px_20px_rgba(0,0,0,0.03)]" 
          : "py-8 bg-transparent"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-[14px] bg-foreground flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-all duration-500">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-[-0.05em] leading-none text-foreground">
              Mar<span className="text-primary">IA</span>
            </span>
            <span className="text-badge leading-none mt-1.5">Bombinhas • SC</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a 
              key={l.href} 
              href={l.href} 
              className="text-badge text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link 
            to="/anuncie" 
            className="text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors tracking-[0.1em] uppercase"
          >
            Anunciar
          </Link>
          <div className="w-px h-4 bg-slate-200" />
          <Button 
            asChild 
            size="sm" 
            className="rounded-full bg-foreground hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200"
          >
            <a href="#experimentar">Entrar</a>
          </Button>
        </nav>

        <button 
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-muted text-slate-900" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 p-4 bg-background/95 backdrop-blur-2xl border-b border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-2">
            {links.map((l) => (
              <a 
                key={l.href} 
                href={l.href} 
                onClick={() => setOpen(false)} 
                className="text-sm font-bold text-muted-foreground p-4 rounded-2xl hover:bg-muted transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link 
              to="/anuncie" 
              onClick={() => setOpen(false)} 
              className="text-sm font-bold text-muted-foreground p-4 rounded-2xl hover:bg-muted transition-colors"
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