import { Bot } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-gradient">Mar</span>
          <span className="text-foreground">IA</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} MarIA — Inteligência artificial para Bombinhas, SC.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;