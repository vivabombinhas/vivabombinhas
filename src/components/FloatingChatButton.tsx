import { Link } from "react-router-dom";
import { Bot } from "lucide-react";

const FloatingChatButton = () => {
  return (
    <Link
      to="/maria"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform duration-200 animate-fade-up"
      aria-label="Conversar com MarIA"
    >
      <Bot className="w-6 h-6" />
    </Link>
  );
};

export default FloatingChatButton;
