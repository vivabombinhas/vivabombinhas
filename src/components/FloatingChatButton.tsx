import { Link } from "react-router-dom";
import { Bot, Sparkles } from "lucide-react";

const FloatingChatButton = () => {
  return (
    <Link
      to="/maria"
      className="fixed bottom-8 right-8 z-50 group"
      aria-label="Conversar com MarIA"
    >
      <div className="relative flex items-center justify-center">
        {/* Breathing Effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
        
        <div className="relative w-16 h-16 rounded-full bg-foreground text-white shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-active:scale-95 group-hover:shadow-primary/20">
          <Bot className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg border-2 border-background scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        {/* Tooltip-like badge */}
        <div className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-white border border-border/50 shadow-xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 whitespace-nowrap">
          <span className="text-[11px] font-bold text-foreground">Dúvidas? Fale com a MarIA</span>
        </div>
      </div>
    </Link>
  );
};

export default FloatingChatButton;