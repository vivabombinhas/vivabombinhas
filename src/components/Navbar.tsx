import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Bot } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Para Quem", href: "#para-quem" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Bot className="h-7 w-7 text-primary" />
          <span className="text-gradient">Mar</span>
          <span className="text-foreground">IA</span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Button asChild size="sm">
            <a href="#experimentar">Experimentar Grátis</a>
          </Button>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden glass border-t border-border px-6 pb-4 flex flex-col gap-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground py-2">
              {l.label}
            </a>
          ))}
          <Button asChild size="sm" className="w-full">
            <a href="#experimentar" onClick={() => setOpen(false)}>Experimentar Grátis</a>
          </Button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
