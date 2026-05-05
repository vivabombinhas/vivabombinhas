import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Cpu } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminAIConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    model: "",
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: "",
  });

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
      const { error } = await supabase
        .from("ai_config")
        .update({
          model: newData.model,
          temperature: Number(newData.temperature),
          max_tokens: Number(newData.max_tokens),
          system_prompt: newData.system_prompt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config?.id);

      if (error) throw error;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
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
