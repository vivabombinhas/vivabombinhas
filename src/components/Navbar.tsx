import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Bot } from "lucide-react";
import { buildMariaWhatsappLink } from "@/lib/maria-whatsapp";

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
    { label: "Casos de Uso", href: "/casos-de-uso" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled 
          ? "py-3 bg-white/95 backdrop-blur-md border-b border-border/40 shadow-sm" 
          : "py-4 bg-[#04111f]/60 backdrop-blur-xl border-b border-white/5"
      }`}
    >
      <div className="container-wide flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:scale-105 duration-500 ${scrolled ? "bg-foreground" : "bg-white/15 backdrop-blur-sm"}`}>
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? "text-foreground" : "text-white"}`}>
              Mar<span className="text-primary italic">IA</span>
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider leading-none transition-colors ${scrolled ? "text-muted-foreground/80" : "text-white/60"}`}>Bombinhas • SC</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            l.href.startsWith("/") ? (
              <Link 
                key={l.href} 
                to={l.href} 
                className={`text-badge transition-colors ${
                  scrolled 
                    ? "text-muted-foreground hover:text-foreground" 
                    : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ) : (
              <a 
                key={l.href} 
                href={l.href} 
                className={`text-badge transition-colors ${
                  scrolled 
                    ? "text-muted-foreground hover:text-foreground" 
                    : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
              </a>
            )
          ))}
          <Link 
            to="/anuncie" 
            className={`text-badge transition-colors ${
              scrolled 
                ? "text-muted-foreground hover:text-foreground" 
                : "text-white/80 hover:text-white"
            }`}
          >
            Anunciar
          </Link>
          <div className={`w-px h-4 transition-colors ${scrolled ? "bg-slate-200" : "bg-white/20"}`} />
          <Button 
            asChild 
            size="sm" 
            className="rounded-full bg-[#0c7fd4] hover:bg-[#0c7fd4]/90 text-white font-bold px-8 h-11 shadow-xl shadow-primary/10 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20"
          >
            <a href={buildMariaWhatsappLink("geral")} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
          </Button>
        </nav>

        <button 
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-muted text-slate-900" 
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 p-0 bg-background/95 backdrop-blur-2xl border-b border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col">
            {links.map((l) => (
              l.href.startsWith("/") ? (
                <Link 
                  key={l.href} 
                  to={l.href} 
                  onClick={() => setOpen(false)} 
                  className="text-sm font-bold text-muted-foreground p-4 border-b border-border/10 hover:bg-muted transition-colors min-h-[44px] flex items-center"
                >
                  {l.label}
                </Link>
              ) : (
                <a 
                  key={l.href} 
                  href={l.href} 
                  onClick={() => setOpen(false)} 
                  className="text-sm font-bold text-muted-foreground p-4 border-b border-border/10 hover:bg-muted transition-colors min-h-[44px] flex items-center"
                >
                  {l.label}
                </a>
              )
            ))}
            <Link 
              to="/anuncie" 
              onClick={() => setOpen(false)} 
              className="text-sm font-bold text-muted-foreground p-4 border-b border-border/10 hover:bg-muted transition-colors min-h-[44px] flex items-center"
            >
              Anunciar
            </Link>
            <div className="p-4">
              <Button asChild className="w-full rounded-2xl h-14 text-sm font-bold bg-primary text-primary-foreground hover:brightness-110">
                <a href="/maria" onClick={() => setOpen(false)}>Experimentar Grátis</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;