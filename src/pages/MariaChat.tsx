import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Bot, Trash2, ArrowLeft, ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMariaChat } from "@/hooks/useMariaChat";
import { ChatMessage } from "@/components/maria/ChatMessage";
import { ChatInput } from "@/components/maria/ChatInput";
import { SuggestionChips } from "@/components/maria/SuggestionChips";
import { FinalidadeQualifier } from "@/components/maria/FinalidadeQualifier";
import { Button } from "@/components/ui/button";

const MariaChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, clearChat, hasMore, showMore, submitLead, finalidade, setFinalidade, clearFinalidade } = useMariaChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    if (state?.initialMessage && !initializedRef.current && messages.length === 0) {
      initializedRef.current = true;
      sendMessage(state.initialMessage);
      // Limpa o state para não reenviar ao atualizar a página ou navegar de volta
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, sendMessage, messages.length]);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has rendered (including property cards)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <Helmet>
        <title>MarIA — Assistente de imóveis em Bombinhas</title>
        <meta name="description" content="Converse com a MarIA, a assistente de IA que encontra imóveis em Bombinhas para temporada, aluguel anual, compra ou investimento." />
        <link rel="canonical" href="https://vivabombinhas.lovable.app/maria" />
        <meta property="og:title" content="MarIA — Assistente de imóveis em Bombinhas" />
        <meta property="og:description" content="Encontre imóveis reais e disponíveis em Bombinhas conversando com a MarIA." />
        <meta property="og:url" content="https://vivabombinhas.lovable.app/maria" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="noindex" />
      </Helmet>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <Link to="/" aria-label="Voltar para a página inicial">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Voltar">
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
              <span className="sr-only"> — Assistente de imóveis em Bombinhas</span>
            </h1>
            <p className="text-xs text-muted-foreground">Assistente de imóveis • Bombinhas</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Limpar conversa" className="rounded-full text-muted-foreground">
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
                Sua assistente inteligente de imóveis em Bombinhas.
              </p>
            </div>
            {!finalidade ? (
              <FinalidadeQualifier onSelect={setFinalidade} />
            ) : (
              <div className="w-full space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  Buscando para{" "}
                  <span className="font-semibold text-accent">
                    {finalidade === "temporada" ? "🏖️ Temporada" : finalidade === "aluguel_anual" ? "🏠 Aluguel anual" : "💰 Comprar"}
                  </span>
                  {" · "}
                  <button onClick={clearFinalidade} className="underline hover:text-foreground">
                    trocar
                  </button>
                </p>
                <SuggestionChips onSelect={sendMessage} finalidade={finalidade} />
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSubmitLead={submitLead} />
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

        {hasMore && !isLoading && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={showMore}
              className="rounded-full gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Ver mais resultados
            </Button>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default MariaChat;
