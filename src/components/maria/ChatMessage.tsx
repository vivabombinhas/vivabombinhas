import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useMariaChat";
import { PropertyCard } from "./PropertyCard";
import { LeadCaptureForm } from "./LeadCaptureForm";

interface ChatMessageProps {
  message: ChatMessageType;
  onSubmitLead?: (nome: string, telefone: string) => Promise<boolean>;
}

export function ChatMessage({ message, onSubmitLead }: ChatMessageProps) {
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
      <div className={`max-w-[85%] space-y-3`}>
        {/* Text bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAssistant
              ? "bg-card text-card-foreground border border-border shadow-sm"
              : "bg-primary text-primary-foreground"
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
            onSubmit={onSubmitLead!}
          />
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
