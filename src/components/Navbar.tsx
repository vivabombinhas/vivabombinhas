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
    { label: "Casos de Uso", href: "/casos-de-uso" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
        scrolled 
          ? "py-3 bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm" 
          : "py-6 bg-transparent"
      }`}
    >
      <div className="container-wide flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center group-hover:scale-105 transition-all duration-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Mar<span className="text-primary italic">IA</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">Bombinhas • SC</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            l.href.startsWith("/") ? (
              <Link 
                key={l.href} 
                to={l.href} 
                className="text-badge text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ) : (
              <a 
                key={l.href} 
                href={l.href} 
                className="text-badge text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            )
          ))}
          <Link 
            to="/anuncie" 
            className="text-badge text-muted-foreground hover:text-foreground transition-colors"
          >
            Anunciar
          </Link>
          <div className="w-px h-4 bg-slate-200" />
          <Button 
            asChild 
            size="sm" 
            className="rounded-full bg-[#0c7fd4] hover:bg-[#0c7fd4]/90 text-white font-bold text-badge px-8 h-11 shadow-xl shadow-primary/10 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20"
          >
            <a href="/maria">Experimentar</a>
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
                <a href="#experimentar" onClick={() => setOpen(false)}>Experimentar Grátis</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;