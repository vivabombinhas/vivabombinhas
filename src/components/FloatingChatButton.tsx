import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { buildMariaWhatsappLink } from "@/lib/maria-whatsapp";

const FloatingChatButton = () => {
  const href = buildMariaWhatsappLink("geral");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[60] group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full transition-all"
      aria-label="Falar com a MarIA no WhatsApp"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-[#25D366]/30 rounded-full animate-ping opacity-30" />
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-active:scale-95">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" />
        </div>
        <div className="hidden md:block absolute right-full mr-4 px-4 py-2 rounded-xl bg-white border border-border/50 shadow-xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 whitespace-nowrap">
          <span className="text-[11px] font-bold text-foreground">Falar com a MarIA no WhatsApp</span>
        </div>
      </div>
    </a>
  );
};

export default FloatingChatButton;

// Mantém compatibilidade caso algo importe Link
export { Link };
