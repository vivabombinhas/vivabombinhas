import { Link } from "react-router-dom";
import { Bot, Sparkles } from "lucide-react";

const FloatingChatButton = () => {
  return (
    <Link
      to="/maria"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[60] group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full transition-all"
      aria-label="Conversar com MarIA"
    >
      <div className="relative flex items-center justify-center">
        {/* Breathing Effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
        
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-foreground text-white shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-active:scale-95 group-hover:shadow-primary/20">
          <Bot className="w-6 h-6 md:w-7 md:h-7" />
          <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg border-2 border-background scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
            <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
          </div>
        </div>

        {/* Tooltip-like badge - hidden on mobile to avoid overlap */}
        <div className="hidden md:block absolute right-full mr-4 px-4 py-2 rounded-xl bg-white border border-border/50 shadow-xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 whitespace-nowrap">
          <span className="text-[11px] font-bold text-foreground">Dúvidas? Fale com a MarIA</span>
        </div>
      </div>
    </Link>
  );
};

export default FloatingChatButton;