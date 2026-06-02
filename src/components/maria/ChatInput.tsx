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

  const handleSend = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSendingRef.current) return;
    
    isSendingRef.current = true;
    onSend(trimmed);
    setInput("");
    
    // Pequeno timeout para evitar envios duplos rápidos
    setTimeout(() => {
      isSendingRef.current = false;
    }, 500);

    // No mobile, evitamos forçar o focus se o teclado já foi fechado ou está em transição
    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // No mobile, evitamos enviar no Enter se for um teclado virtual que envia Enter para "Space" em alguns contextos
    // Mas o principal problema relatado é que ao clicar em "espaço" ele envia.
    // Isso geralmente acontece se o botão de enviar estiver com foco ou se houver algum listener global.
    // Vamos garantir que apenas Enter físico (não shift) envie.
    if (e.key === "Enter" && !e.shiftKey) {
      // Verifica se é mobile para ser mais permissivo com o Enter (permitir quebra de linha por padrão em alguns teclados)
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <form 
      onSubmit={(e) => handleSend(e)}
      className="flex flex-col gap-2 p-3 sm:p-4 border-t border-border bg-background/95 backdrop-blur-md"
    >
      <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
        <textarea
          id="maria-chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Ajuste dinâmico de altura
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escreva aqui sua busca..."
          aria-label="Mensagem para a MarIA"
          className="flex-1 resize-none rounded-2xl border border-input bg-muted/50 px-4 py-3 text-[16px] sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[48px] max-h-[150px]"
          rows={1}
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          size="icon"
          aria-label="Enviar mensagem"
          className="rounded-2xl h-[48px] w-[48px] bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
        >
          <Send className="w-5 h-5 text-white" />
        </Button>
      </div>
      <p className="text-[10px] text-center text-muted-foreground/60 px-4">
        MarIA pode cometer erros. Verifique informações importantes.
      </p>
    </form>
  );
}
