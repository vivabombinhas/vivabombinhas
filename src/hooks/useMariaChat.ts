import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/components/maria/PropertyCard";
import type { Finalidade } from "@/components/maria/FinalidadeQualifier";

const FINALIDADE_KEY = "maria_finalidade";
const FINALIDADE_LABEL: Record<Finalidade, string> = {
  temporada: "aluguel de temporada",
  aluguel_anual: "aluguel anual (pra morar)",
  venda: "compra (venda)",
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  properties?: Property[];
  showLeadForm?: boolean; // exibe o formulário inline abaixo dessa mensagem
  remainingForGate?: number; // quantos imóveis estão "trancados"
  isAlertMode?: boolean; // true = modo alerta de novidade (sem resultados)
}

const MORE_PATTERNS = /^(tem mais|mostrar mais|mais op[çc][õo]es|outras op[çc][õo]es|quero ver mais|mais resultados|ver mais|mais im[óo]veis|próximos|next)\??$/i;
const LEAD_CAPTURED_KEY = "maria_lead_captured"; // localStorage (persistente entre sessões)
const SESSION_KEY = "maria_session_id";

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function readLeadCaptured(): boolean {
  try {
    return localStorage.getItem(LEAD_CAPTURED_KEY) === "1";
  } catch {
    return false;
  }
}

function setLeadCapturedPersistent() {
  try {
    localStorage.setItem(LEAD_CAPTURED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function useMariaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [finalidade, setFinalidadeState] = useState<Finalidade | null>(() => {
    try {
      const v = localStorage.getItem(FINALIDADE_KEY);
      return v === "venda" || v === "aluguel_anual" || v === "temporada" ? v : null;
    } catch {
      return null;
    }
  });
  const allPropertiesRef = useRef<Property[]>([]);
  const shownCountRef = useRef(0);
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const leadCapturedRef = useRef<boolean>(readLeadCaptured());
  const gateActiveRef = useRef<boolean>(false);
  const finalidadeHintSentRef = useRef<boolean>(false);

  const setFinalidade = useCallback((f: Finalidade) => {
    try { localStorage.setItem(FINALIDADE_KEY, f); } catch { /* ignore */ }
    setFinalidadeState(f);
    finalidadeHintSentRef.current = false;
  }, []);

  const clearFinalidade = useCallback(() => {
    try { localStorage.removeItem(FINALIDADE_KEY); } catch { /* ignore */ }
    setFinalidadeState(null);
    finalidadeHintSentRef.current = false;
  }, []);

  const updateHasMore = useCallback(() => {
    // Se o gate está ativo (lead ainda não preenchido), não mostra botão "Ver mais"
    if (gateActiveRef.current && !leadCapturedRef.current) {
      setHasMore(false);
      return;
    }
    setHasMore(allPropertiesRef.current.length > shownCountRef.current);
  }, []);

  const clearPropertyState = useCallback(() => {
    allPropertiesRef.current = [];
    shownCountRef.current = 0;
    gateActiveRef.current = false;
    setHasMore(false);
  }, []);

  const showMore = useCallback(() => {
    // Bloqueio extra: se gate ativo e lead não capturado, não libera
    if (gateActiveRef.current && !leadCapturedRef.current) return;

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
    if (!MORE_PATTERNS.test(content.trim()) || remaining.length === 0) return false;
    // Se gate ativo e lead não capturado, não libera via "ver mais"
    if (gateActiveRef.current && !leadCapturedRef.current) return false;

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

      // Injeta um hint de contexto (finalidade selecionada no qualifier) APENAS na primeira
      // chamada após a escolha. Vai como mensagem do usuário invisível pra ancorar o LLM.
      if (finalidade && !finalidadeHintSentRef.current) {
        conversationHistory.unshift({
          role: "user",
          content: `[contexto: o cliente está procurando ${FINALIDADE_LABEL[finalidade]}. Considere essa finalidade nas próximas buscas a menos que ele mude explicitamente.]`,
        });
        finalidadeHintSentRef.current = true;
      }

      const { data, error } = await supabase.functions.invoke("maria-search", {
        body: {
          messages: conversationHistory,
          session_id: sessionIdRef.current,
          lead_captured: leadCapturedRef.current, // sinaliza ao backend
          finalidade_hint: finalidade ?? undefined,
        },
      });

      if (error) throw error;

      const showResults = data.show_results === true;
      const clearResults = data.clear_results === true;
      // Backend só ativa gate se lead realmente não estiver capturado
      const gateActive = data.gate_active === true && !leadCapturedRef.current;
      const noResultsGate = data.no_results_gate === true && !leadCapturedRef.current;

      if (showResults) {
        const allProps: Property[] = data.all_properties || [];
        allPropertiesRef.current = allProps;
        gateActiveRef.current = gateActive;
        // Se gate ativo: 1 card teaser; senão até 3
        const initial = gateActive ? 1 : 3;
        shownCountRef.current = Math.min(initial, allProps.length);
      } else if (clearResults) {
        clearPropertyState();
      } else if (noResultsGate) {
        // Sem resultados, mas precisamos capturar o lead → não limpa nem mostra cards,
        // mas deixa gate ativo pra exibir o formulário de "alerta de novidade".
        allPropertiesRef.current = [];
        shownCountRef.current = 0;
        gateActiveRef.current = true;
      }

      const remainingForGate = gateActive
        ? Math.max(0, allPropertiesRef.current.length - shownCountRef.current)
        : 0;

      // Mostra o formulário se: gate clássico (com ou sem mais imóveis) OU gate sem-resultados.
      const showLeadForm = gateActive || noResultsGate;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        properties: showResults && data.properties?.length > 0 ? data.properties : undefined,
        showLeadForm,
        remainingForGate: noResultsGate ? 0 : remainingForGate,
        isAlertMode: noResultsGate,
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
  }, [messages, handleShowMore, updateHasMore, clearPropertyState, finalidade]);

  // Submit do formulário inline de captação
  const submitLead = useCallback(async (nome: string, telefone: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("maria-search", {
        body: {
          action: "submit_lead",
          session_id: sessionIdRef.current,
          nome,
          telefone,
        },
      });
      if (error || !data?.success) return false;

      // Marca persistentemente: nunca mais pedir nessa origem
      setLeadCapturedPersistent();
      leadCapturedRef.current = true;
      gateActiveRef.current = false;

      // Libera todos os resultados acumulados em uma nova mensagem da MarIA
      const all = allPropertiesRef.current;
      const remaining = all.slice(shownCountRef.current);
      shownCountRef.current = all.length;

      // Remove o formulário das mensagens anteriores (não exibir mais)
      setMessages((prev) => {
        const cleaned = prev.map((m) => ({ ...m, showLeadForm: false }));
      const firstName = nome.trim().split(/\s+/)[0];
      
      // Notificação via Edge Function (Simulação de Real-time)
      try {
        await supabase.functions.invoke("notify-broker", {
          body: { lead_name: nome, lead_phone: telefone, session_id: sessionIdRef.current }
        });
      } catch (err) {
        console.error("Erro ao notificar corretor:", err);
      }

      // Remove o formulário das mensagens anteriores (não exibir mais)
      setMessages((prev) => {
        const cleaned = prev.map((m) => ({ ...m, showLeadForm: false }));
        const reply: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: remaining.length > 0
            ? `Pronto, ${firstName}! 🎉 Liberei tudo pra você. Aqui ${remaining.length === 1 ? "está a outra opção" : `estão as outras ${remaining.length} opções`} que separei 👇`
            : `Pronto, ${firstName}! 🎉 Já te aviso pelo WhatsApp assim que aparecer algo novo no seu perfil.`,
          timestamp: new Date(),
          properties: remaining.length > 0 ? remaining : undefined,
        };
        return [...cleaned, reply];
      });

      updateHasMore();
      return true;
    } catch (e) {
      console.error("submitLead error:", e);
      return false;
    }
  }, [updateHasMore]);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearPropertyState();
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    sessionIdRef.current = getOrCreateSessionId();
    finalidadeHintSentRef.current = false;
    // NÃO limpa leadCaptured do localStorage — é permanente por usuário/dispositivo
    // NÃO limpa finalidade — é a preferência do usuário (use clearFinalidade pra trocar)
  }, [clearPropertyState]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    hasMore,
    showMore,
    submitLead,
    finalidade,
    setFinalidade,
    clearFinalidade,
  };
}
