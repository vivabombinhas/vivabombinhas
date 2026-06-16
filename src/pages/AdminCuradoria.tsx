import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Sparkles,
  EyeOff,
  Eye,
  Crown
} from "lucide-react";

export default function AdminCuradoria() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: imoveis, isLoading, error: imoveisError } = useQuery({
    queryKey: ["admin_curadoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase
        .from("imoveis")
        .update({ 
          ...updates,
          last_curated_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_curadoria"] });
      toast({ title: "Atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const filteredImoveis = imoveis?.filter(i => 
    i.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    i.bairro?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Curadoria & Destaques
          </h1>
          <p className="text-muted-foreground text-sm">Controle quais imóveis aparecem na MarIA e quais são Premium</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou bairro..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead className="text-center">Premium</TableHead>
              <TableHead className="text-center">Ativo no Chat</TableHead>
              <TableHead>Última Curadoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">Carregando...</TableCell>
              </TableRow>
            ) : imoveisError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-destructive">
                  Erro ao carregar imóveis: {(imoveisError as Error).message}
                </TableCell>
              </TableRow>
            ) : filteredImoveis?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhum imóvel encontrado</TableCell>
              </TableRow>
            ) : (
              filteredImoveis?.map((imovel) => (
                <TableRow key={imovel.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{imovel.titulo}</span>
                      <span className="text-xs text-muted-foreground">{imovel.bairro} · R$ {imovel.preco?.toLocaleString("pt-BR") || imovel.preco_temporada_diaria?.toLocaleString("pt-BR")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className={`w-4 h-4 ${imovel.destaque_premium ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                      <Switch 
                        checked={imovel.destaque_premium || false}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: imovel.id, updates: { destaque_premium: checked }})}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {imovel.oculta_para_maria ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-primary" />
                      )}
                      <Switch 
                        checked={!imovel.oculta_para_maria}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: imovel.id, updates: { oculta_para_maria: !checked }})}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {imovel.last_curated_at ? new Date(imovel.last_curated_at).toLocaleDateString("pt-BR") : "Nunca"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}