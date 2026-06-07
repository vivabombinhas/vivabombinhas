import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useMariaChat";
import { PropertyCard } from "./PropertyCard";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { SuggestionChips } from "./SuggestionChips";

interface ChatMessageProps {
  message: ChatMessageType;
  onSubmitLead?: (nome: string, telefone: string, extraData?: any) => Promise<boolean>;
  onSelectSuggestion?: (suggestion: string) => void;
}

export function ChatMessage({ message, onSubmitLead, onSelectSuggestion }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const hasProperties = isAssistant && message.properties && message.properties.length > 0;
  const showLeadForm = isAssistant && message.showLeadForm && onSubmitLead;

  return (
    <div className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={`max-w-[88%] sm:max-w-[85%] space-y-2`}>
        {/* Text bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-[15px] sm:text-sm leading-relaxed ${
            isAssistant
              ? "bg-card text-card-foreground border border-border shadow-sm"
              : "bg-primary text-primary-foreground shadow-sm font-medium"
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>

        {/* Property cards */}
        {hasProperties && (
          <div className="space-y-2.5">
            {message.properties!.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Inline lead capture form (gate) */}
        {showLeadForm && (
          <LeadCaptureForm
            remainingCount={message.remainingForGate ?? 0}
            isAlertMode={message.isAlertMode}
            isStrategicMode={message.isStrategicAnalysis}
            onSubmit={(nome, tel, data) => onSubmitLead!(nome, tel, { ...data, isStrategicMode: message.isStrategicAnalysis })}
          />
        )}

        {/* Inline suggestions */}
        {isAssistant && message.suggestions && onSelectSuggestion && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onSelectSuggestion(s.value)}
                  className="group flex flex-col items-start text-left p-3 rounded-2xl border border-border bg-card/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-md flex-1 min-w-[200px]"
                >
                  <span className="font-semibold text-sm mb-0.5">
                    {s.label}
                  </span>
                  {s.subtext && (
                    <span className="text-[10px] text-muted-foreground/70 group-hover:text-primary-foreground/90 leading-tight">
                      {s.subtext}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
