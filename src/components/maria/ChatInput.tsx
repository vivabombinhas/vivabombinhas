import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSendingRef.current) return;
    
    isSendingRef.current = true;
    onSend(trimmed);
    setInput("");
    
    // Pequeno timeout para evitar envios duplos rápidos
    setTimeout(() => {
      isSendingRef.current = false;
    }, 500);

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border bg-card">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ex: apartamento para alugar em Bombas até R$3.000..."
        className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[120px]"
        rows={1}
        disabled={isLoading}
      />
      <Button
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        size="icon"
        className="rounded-xl h-[44px] w-[44px] bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
