import { AdminPageBanner } from "@/components/admin/AdminPageBanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Cpu, Play, MessageSquare, RefreshCw, Activity, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type CoreConfigResponse = {
  configured: boolean;
  status: "ok" | "not_configured" | "error" | "timeout";
  message: string;
  config: Record<string, unknown> | null;
  latency_ms?: number | null;
  http_status?: number | null;
  checked_at: string;
};

function coreStatusBadge(status: CoreConfigResponse["status"]) {
  switch (status) {
    case "ok":
      return (
        <Badge className="bg-green-500/15 text-green-700 border border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> OK
        </Badge>
      );
    case "not_configured":
      return (
        <Badge variant="secondary">
          <AlertTriangle className="w-3 h-3 mr-1" /> Não configurado
        </Badge>
      );
    case "timeout":
      return (
        <Badge className="bg-yellow-500/15 text-yellow-700 border border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" /> Timeout
        </Badge>
      );
    default:
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Erro
        </Badge>
      );
  }
}

export default function AdminAIConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    model: "",
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: "",
  });
  const [testInput, setTestInput] = useState("Oi, tudo bem?");
  const [testResult, setTestResult] = useState<{ reply: string; debug?: any } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["ai_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_config")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const coreConfigQuery = useQuery({
    queryKey: ["maria_core_config"],
    queryFn: async (): Promise<CoreConfigResponse> => {
      const { data, error } = await supabase.functions.invoke("maria-core-config", {
        method: "POST",
      });
      if (error) throw error;
      return data as CoreConfigResponse;
    },
  });


  useEffect(() => {
    if (config) {
      setFormData({
        model: config.model || "",
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 1000,
        system_prompt: config.system_prompt || "",
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (newData: typeof formData) => {
      const updateData = {
        model: newData.model,
        temperature: Number(newData.temperature),
        max_tokens: Number(newData.max_tokens),
        system_prompt: newData.system_prompt,
        updated_at: new Date().toISOString(),
      };

      if (config?.id) {
        const { error } = await supabase
          .from("ai_config")
          .update(updateData)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_config")
          .insert([updateData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_config"] });
      toast({
        title: "Configuração atualizada",
        description: "Os parâmetros da MarIA foram salvos com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleTestIA = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("maria-search", {
        body: {
          messages: [{ role: "user", content: testInput }],
          session_id: "test-session-" + Date.now(),
        },
      });

      if (error) throw error;
      setTestResult({
        reply: data?.reply || "Sem resposta da IA.",
        debug: data?.debug_config
      });
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <AdminPageBanner
        variant="warning"
        title="Plano B da MarIA (fallback local)"
        description={
          <>
            Esta tela configura o <strong>fallback local</strong> da plataforma (Lovable AI Gateway).
            Ele só entra em ação se o cérebro principal — o <strong>MarIA Core (Claude)</strong> —
            estiver fora do ar. <strong>Não é a MarIA principal.</strong> A MarIA de verdade,
            que atende no WhatsApp e no site, roda no MarIA Core (aba ao lado).
          </>
        }
      />
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração da IA</h1>
          <p className="text-muted-foreground">
            Gerencie o comportamento e os parâmetros da MarIA.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> MarIA Core
            </CardTitle>
            <CardDescription>
              Estado da integração com o backend externo (somente leitura).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => coreConfigQuery.refetch()}
            disabled={coreConfigQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${coreConfigQuery.isFetching ? "animate-spin" : ""}`} />
            Recarregar config
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {coreConfigQuery.isLoading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Consultando MarIA Core…
            </div>
          ) : coreConfigQuery.data ? (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                {coreStatusBadge(coreConfigQuery.data.status)}
                <span className="text-sm text-muted-foreground">
                  {coreConfigQuery.data.message}
                </span>
                {coreConfigQuery.data.latency_ms != null && (
                  <span className="text-xs text-muted-foreground">
                    {coreConfigQuery.data.latency_ms} ms
                  </span>
                )}
              </div>

              {!coreConfigQuery.data.configured && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Configuração local ativa</AlertTitle>
                  <AlertDescription>
                    O MarIA Core ainda não está configurado. A MarIA continua
                    operando com a configuração local abaixo (fallback seguro).
                    Edição/envio ao Core está desativado nesta versão.
                  </AlertDescription>
                </Alert>
              )}

              {coreConfigQuery.data.configured && coreConfigQuery.data.status !== "ok" && (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertTitle>Falha ao ler config do Core</AlertTitle>
                  <AlertDescription>
                    Usando configuração local como fallback. Detalhes: {coreConfigQuery.data.message}
                  </AlertDescription>
                </Alert>
              )}

              {coreConfigQuery.data.config && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Config recebida do Core (sanitizada)
                  </div>
                  <pre className="text-[11px] bg-muted/40 rounded p-3 overflow-x-auto max-h-64">
                    {JSON.stringify(coreConfigQuery.data.config, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-destructive">
              {(coreConfigQuery.error as any)?.message ?? "Falha ao consultar MarIA Core."}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Modelo e Parâmetros</CardTitle>
            <CardDescription>
              Ajuste o modelo de linguagem e as configurações de geração.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo AI Gateway</Label>
                <Input
                  id="model"
                  placeholder="ex: google/gemini-2.0-flash-exp"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Identificador do modelo no Lovable AI Gateway.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura ({formData.temperature})</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Controla a criatividade: 0 é focado e 1 é mais criativo.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Limite máximo de tokens na resposta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              Define a personalidade e as regras de comportamento da MarIA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                id="system_prompt"
                className="min-h-[300px] font-mono text-sm"
                placeholder="Você é a MarIA, assistente virtual da Viva Bombinhas..."
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testar Configurações</CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para validar o comportamento da IA com os parâmetros salvos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testInput">Mensagem de Teste</Label>
              <div className="flex gap-2">
                <Input
                  id="testInput"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Digite algo para testar..."
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleTestIA} 
                  disabled={isTesting}
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Testar IA agora
                </Button>
              </div>
            </div>

            {testResult && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 rounded-lg bg-muted border">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Resposta da MarIA:
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{testResult.reply}</p>
                </div>

                {testResult.debug && (
                  <div className="p-4 rounded-lg bg-slate-950 text-slate-50 border font-mono text-[10px] overflow-auto">
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-400 uppercase tracking-wider">
                      <Cpu className="w-3 h-3" />
                      Parâmetros Utilizados:
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                      <div><span className="text-slate-500">model:</span> {testResult.debug.model}</div>
                      <div><span className="text-slate-500">temp:</span> {testResult.debug.temperature}</div>
                      <div><span className="text-slate-500">max_tokens:</span> {testResult.debug.maxTokens}</div>
                    </div>
                    <div className="border-t border-slate-800 pt-2 mt-2">
                      <div className="text-slate-400 mb-1">SYSTEM_PROMPT:</div>
                      <div className="whitespace-pre-wrap opacity-80 leading-relaxed">
                        {testResult.debug.systemPrompt}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
