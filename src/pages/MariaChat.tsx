import { useEffect, useRef } from "react";
import { Bot, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useMariaChat } from "@/hooks/useMariaChat";
import { ChatMessage } from "@/components/maria/ChatMessage";
import { ChatInput } from "@/components/maria/ChatInput";
import { SuggestionChips } from "@/components/maria/SuggestionChips";
import { Button } from "@/components/ui/button";

const MariaChat = () => {
  const { messages, isLoading, sendMessage, clearChat } = useMariaChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display leading-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mar</span>
              <span className="text-foreground">IA</span>
            </h1>
            <p className="text-xs text-muted-foreground">Assistente de imóveis • Bombinhas</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-full text-muted-foreground">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground">
                Olá! Eu sou a{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mar</span>
                <span>IA</span> 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Sua assistente inteligente de imóveis em Bombinhas. Me diga o que você procura!
              </p>
            </div>
            <SuggestionChips onSelect={sendMessage} />
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default MariaChat;
