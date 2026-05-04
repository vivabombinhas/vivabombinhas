import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Bot } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Para Quem", href: "#para-quem" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass shadow-sm" : "bg-transparent"}`}>
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Bot className={`h-7 w-7 ${scrolled ? "text-primary" : "text-primary"}`} />
          <span className="text-gradient">Mar</span>
          <span className={scrolled ? "text-foreground" : "text-primary-foreground"}>IA</span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={`text-sm font-medium transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
              {l.label}
            </a>
          ))}
          <Link to="/anuncie" className={`text-sm font-medium transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
            Anuncie
          </Link>
          <Link to="/dashboard" className={`text-sm font-medium transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
            Meu Painel
          </Link>
          <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
            <a href="#experimentar">Experimentar Grátis</a>
          </Button>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className={`h-6 w-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`} /> : <Menu className={`h-6 w-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`} />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden glass border-t border-border px-6 pb-4 flex flex-col gap-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground py-2">
              {l.label}
            </a>
          ))}
          <Link to="/anuncie" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground py-2">
            Anuncie
          </Link>
          <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground py-2">
            Meu Painel
          </Link>
          <Button asChild size="sm" className="w-full rounded-full">
            <a href="#experimentar" onClick={() => setOpen(false)}>Experimentar Grátis</a>
          </Button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
