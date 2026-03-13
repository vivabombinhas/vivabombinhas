import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/components/maria/PropertyCard";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  properties?: Property[];
}

const MORE_PATTERNS = /^(tem mais|mostrar mais|mais op[çc][õo]es|outras op[çc][õo]es|quero ver mais|mais resultados|ver mais|mais im[óo]veis|próximos|next)\??$/i;

export function useMariaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const allPropertiesRef = useRef<Property[]>([]);
  const shownCountRef = useRef(0);

  const updateHasMore = useCallback(() => {
    setHasMore(allPropertiesRef.current.length > shownCountRef.current);
  }, []);

  const showMore = useCallback(() => {
    const remaining = allPropertiesRef.current.slice(shownCountRef.current);
    if (remaining.length === 0) return;

    const nextBatch = remaining.slice(0, 3);
    shownCountRef.current += nextBatch.length;
    const stillRemaining = allPropertiesRef.current.length - shownCountRef.current;

    const replyText = stillRemaining > 0
      ? `Aqui estão mais ${nextBatch.length} opções! Ainda tenho ${stillRemaining} ${stillRemaining === 1 ? "resultado" : "resultados"}, é só pedir 😊`
      : `Aqui estão as últimas ${nextBatch.length} opções que encontrei! Se quiser, posso fazer uma nova busca com outros critérios 😊`;

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyText,
      timestamp: new Date(),
      properties: nextBatch,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    updateHasMore();
  }, [updateHasMore]);

  const handleShowMore = useCallback((content: string): boolean => {
    const remaining = allPropertiesRef.current.slice(shownCountRef.current);
    console.log("[MarIA Debug] handleShowMore:", { content: content.trim(), matchesPattern: MORE_PATTERNS.test(content.trim()), allCount: allPropertiesRef.current.length, shownCount: shownCountRef.current, remainingCount: remaining.length });
    if (!MORE_PATTERNS.test(content.trim()) || remaining.length === 0) return false;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    showMore();
    return true;
  }, [showMore]);

  const sendMessage = useCallback(async (content: string) => {
    if (handleShowMore(content)) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("maria-search", {
        body: { messages: conversationHistory },
      });

      if (error) throw error;

      const allProps: Property[] = data.all_properties || [];
      console.log("[MarIA Debug] sendMessage response:", { allPropsCount: allProps.length, propertiesCount: data.properties?.length, resultsCount: data.results_count });
      allPropertiesRef.current = allProps;
      shownCountRef.current = Math.min(3, allProps.length);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        properties: data.properties?.length > 0 ? data.properties : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      updateHasMore();
    } catch (err) {
      console.error("MarIA error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, tive um problema ao processar sua busca. Pode tentar novamente? 😊",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, handleShowMore, updateHasMore]);

  const clearChat = useCallback(() => {
    setMessages([]);
    allPropertiesRef.current = [];
    shownCountRef.current = 0;
    setHasMore(false);
  }, []);

  return { messages, isLoading, sendMessage, clearChat, hasMore, showMore };
}
