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
    <header className={`fixed top-4 left-0 right-0 z-50 transition-all duration-500 flex justify-center px-4`}>
      <div className={`container max-w-5xl flex h-16 items-center justify-between rounded-full transition-all duration-500 px-8 ${scrolled ? "glass shadow-xl shadow-primary/5 border-white/20" : "bg-white/10 backdrop-blur-md border border-white/10"}`}>
        <a href="#" className="flex items-center gap-2 font-bold text-xl group" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-primary">Mar</span>
          <span className="text-foreground">IA</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/anuncie" className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">
            Anuncie
          </Link>
          <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <a href="#experimentar">Experimentar Grátis</a>
          </Button>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
        </button>
      </div>

      {open && (
        <nav className="absolute top-20 left-4 right-4 md:hidden glass rounded-3xl border border-white/20 p-6 flex flex-col gap-4 shadow-2xl animate-fade-up">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">
              {l.label}
            </a>
          ))}
          <Link to="/anuncie" onClick={() => setOpen(false)} className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">
            Anuncie
          </Link>
          <Button asChild className="w-full rounded-full mt-2">
            <a href="#experimentar" onClick={() => setOpen(false)}>Experimentar Grátis</a>
          </Button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;