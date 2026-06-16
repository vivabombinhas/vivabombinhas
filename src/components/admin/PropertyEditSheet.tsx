import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyEditSheetProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Calcula score 0-100 de qualidade da curadoria
function computeQualidadeScore(p: any): number {
  if (!p) return 0;
  const checks = [
    !!p.titulo && p.titulo.length > 5,
    !!p.descricao && p.descricao.length > 80,
    Array.isArray(p.fotos) && p.fotos.length > 0,
    !!p.preco || !!p.preco_temporada_diaria,
    !!p.bairro,
    !!p.tipo && !!p.finalidade,
    p.distancia_praia_m != null,
    Array.isArray(p.pontos_fortes) && p.pontos_fortes.length > 0,
    !!p.resumo_estrategico_ia && p.resumo_estrategico_ia.length > 20,
    p.finalidade !== "temporada" || (p.capacidade_pessoas ?? 0) > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}


export function PropertyEditSheet({ property, open, onOpenChange }: PropertyEditSheetProps) {
  const isNew = !property.id;
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setFormData({ ...property });
    }
  }, [property, open]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, created_at, updated_at, ...updateData } = data;
      
      // Limpeza de campos vazios/nulos se necessário ou conversão de tipos
      if (updateData.preco === "") updateData.preco = null;
      if (updateData.area_m2 === "") updateData.area_m2 = null;
      if (updateData.distancia_praia_m === "" || Number.isNaN(updateData.distancia_praia_m)) updateData.distancia_praia_m = null;

      // Calcula qualidade_score automaticamente
      updateData.qualidade_score = computeQualidadeScore(updateData);

      if (isNew) {
        const { error } = await supabase.from("imoveis").insert([{
          ...updateData,
          status: updateData.status || "ativo",
          origem: updateData.origem || "manual"
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("imoveis").update(updateData).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_imoveis"] });
      toast({ title: isNew ? "Imóvel criado!" : "Imóvel atualizado!" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao salvar", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Converte texto multilinha/CSV em array (e vice-versa)
  const arrayToText = (v: any) => Array.isArray(v) ? v.join("\n") : (v || "");
  const textToArray = (s: string) =>
    s.split(/[\n,]+/).map(x => x.trim()).filter(Boolean);

  const handleSave = () => {
    if (!formData.titulo) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    mutation.mutate(formData);
  };

  const previewScore = computeQualidadeScore(formData);


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>{isNew ? "Novo Imóvel" : "Editar Imóvel"}</SheetTitle>
          <SheetDescription>
            {isNew ? "Cadastre um novo imóvel no sistema." : "Altere as informações do imóvel abaixo."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] py-4 pr-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Informações Básicas</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título do Anúncio</Label>
                <Input 
                  id="titulo" 
                  value={formData.titulo || ""} 
                  onChange={(e) => handleChange("titulo", e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="finalidade">Finalidade</Label>
                  <Select 
                    value={formData.finalidade || ""} 
                    onValueChange={(v) => handleChange("finalidade", v)}
                  >
                    <SelectTrigger id="finalidade">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="aluguel_anual">Aluguel Anual</SelectItem>
                      <SelectItem value="temporada">Temporada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select 
                    value={formData.tipo || ""} 
                    onValueChange={(v) => handleChange("tipo", v)}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="sobrado">Sobrado</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="pousada">Pousada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao" 
                  rows={4}
                  value={formData.descricao || ""} 
                  onChange={(e) => handleChange("descricao", e.target.value)} 
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contato & Gestão</h3>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <Label htmlFor="gestao_propria" className="text-sm font-medium">Imóvel Próprio / Gestão Direta</Label>
                  <p className="text-xs text-muted-foreground">Marque se este imóvel é de propriedade ou gestão da sua imobiliária</p>
                </div>
                <Switch 
                  id="gestao_propria"
                  checked={formData.gestao_propria} 
                  onCheckedChange={(v) => handleChange("gestao_propria", v)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="anunciante_nome">Nome do Contato</Label>
                  <Input 
                    id="anunciante_nome" 
                    placeholder="Nome do proprietário ou captador"
                    value={formData.anunciante_nome || ""} 
                    onChange={(e) => handleChange("anunciante_nome", e.target.value)} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="anunciante_telefone">Telefone</Label>
                  <Input 
                    id="anunciante_telefone" 
                    placeholder="(00) 00000-0000"
                    value={formData.anunciante_telefone || ""} 
                    onChange={(e) => handleChange("anunciante_telefone", e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="anunciante_email">E-mail</Label>
                <Input 
                  id="anunciante_email" 
                  type="email"
                  placeholder="contato@exemplo.com"
                  value={formData.anunciante_email || ""} 
                  onChange={(e) => handleChange("anunciante_email", e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Localização</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input 
                    id="cidade" 
                    value={formData.cidade || ""} 
                    onChange={(e) => handleChange("cidade", e.target.value)} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input 
                    id="bairro" 
                    value={formData.bairro || ""} 
                    onChange={(e) => handleChange("bairro", e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco" 
                  value={formData.endereco || ""} 
                  onChange={(e) => handleChange("endereco", e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Características</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quartos">Quartos</Label>
                  <Input 
                    type="number" 
                    id="quartos" 
                    value={formData.quartos || 0} 
                    onChange={(e) => handleChange("quartos", parseInt(e.target.value))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banheiros">Banheiros</Label>
                  <Input 
                    type="number" 
                    id="banheiros" 
                    value={formData.banheiros || 0} 
                    onChange={(e) => handleChange("banheiros", parseInt(e.target.value))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vagas">Vagas</Label>
                  <Input 
                    type="number" 
                    id="vagas" 
                    value={formData.vagas_garagem || 0} 
                    onChange={(e) => handleChange("vagas_garagem", parseInt(e.target.value))} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input 
                    type="number" 
                    id="area" 
                    value={formData.area_m2 || ""} 
                    onChange={(e) => handleChange("area_m2", parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status_prop">Status</Label>
                  <Select 
                    value={formData.status || "ativo"} 
                    onValueChange={(v) => handleChange("status", v)}
                  >
                    <SelectTrigger id="status_prop">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <div className="space-y-0.5">
                  <Label htmlFor="destaque_premium" className="text-sm font-medium text-amber-900 dark:text-amber-200">Destaque Premium</Label>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70">Exibir no topo e com selo especial</p>
                </div>
                <Switch 
                  id="destaque_premium"
                  checked={formData.destaque_premium} 
                  onCheckedChange={(v) => handleChange("destaque_premium", v)} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-slate-100 dark:border-slate-800/30">
                <div className="space-y-0.5">
                  <Label htmlFor="oculta_para_maria" className="text-sm font-medium">Ocultar da MarIA</Label>
                  <p className="text-xs text-muted-foreground">Impedir que a IA recomende este imóvel</p>
                </div>
                <Switch 
                  id="oculta_para_maria"
                  checked={formData.oculta_para_maria} 
                  onCheckedChange={(v) => handleChange("oculta_para_maria", v)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobiliado">Mobiliado</Label>
                  <Switch checked={formData.mobiliado} onCheckedChange={(v) => handleChange("mobiliado", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="piscina">Piscina</Label>
                  <Switch checked={formData.piscina} onCheckedChange={(v) => handleChange("piscina", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ar_condicionado">Ar Condic.</Label>
                  <Switch checked={formData.ar_condicionado} onCheckedChange={(v) => handleChange("ar_condicionado", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="churrasqueira">Churrasq.</Label>
                  <Switch checked={formData.churrasqueira} onCheckedChange={(v) => handleChange("churrasqueira", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Preços</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="preco">Valor (Venda/Aluguel)</Label>
                  <Input 
                    type="number" 
                    id="preco" 
                    value={formData.preco || ""} 
                    onChange={(e) => handleChange("preco", e.target.value === "" ? null : parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="diaria">Diária (Temporada)</Label>
                  <Input 
                    type="number" 
                    id="diaria" 
                    value={formData.preco_temporada_diaria || ""} 
                    onChange={(e) => handleChange("preco_temporada_diaria", e.target.value === "" ? null : parseFloat(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            {/* ================= CURADORIA ESTRATÉGICA ================= */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Curadoria Estratégica
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    previewScore >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : previewScore >= 50
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Qualidade: {previewScore}/100
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Campos internos de curadoria. Não aparecem no card público nem influenciam a busca da MarIA ainda.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="distancia_praia_m">Distância da praia (m)</Label>
                  <Input
                    id="distancia_praia_m"
                    type="number"
                    value={formData.distancia_praia_m ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "distancia_praia_m",
                        e.target.value === "" ? null : parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="micro_regiao">Micro-região</Label>
                  <Select
                    value={formData.micro_regiao || ""}
                    onValueChange={(v) => handleChange("micro_regiao", v)}
                  >
                    <SelectTrigger id="micro_regiao">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orla">Orla</SelectItem>
                      <SelectItem value="miolo">Miolo</SelectItem>
                      <SelectItem value="alto">Alto / Morro</SelectItem>
                      <SelectItem value="beira_rodovia">Beira da rodovia</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="condicao">Condição</Label>
                  <Select
                    value={formData.condicao || ""}
                    onValueChange={(v) => handleChange("condicao", v)}
                  >
                    <SelectTrigger id="condicao">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planta">Na planta</SelectItem>
                      <SelectItem value="em_obra">Em obra</SelectItem>
                      <SelectItem value="pronto_novo">Pronto / Novo</SelectItem>
                      <SelectItem value="usado_conservado">Usado conservado</SelectItem>
                      <SelectItem value="reforma">Precisa de reforma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="perfil_lead_ideal">Perfil de lead ideal</Label>
                  <Input
                    id="perfil_lead_ideal"
                    placeholder="Ex: família com filhos, investidor de renda…"
                    value={formData.perfil_lead_ideal || ""}
                    onChange={(e) => handleChange("perfil_lead_ideal", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="aceita_financiamento">Aceita financiamento</Label>
                  <Switch
                    id="aceita_financiamento"
                    checked={!!formData.aceita_financiamento}
                    onCheckedChange={(v) => handleChange("aceita_financiamento", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="aceita_permuta">Aceita permuta</Label>
                  <Switch
                    id="aceita_permuta"
                    checked={!!formData.aceita_permuta}
                    onCheckedChange={(v) => handleChange("aceita_permuta", v)}
                  />
                </div>
              </div>

              {formData.aceita_permuta && (
                <div className="grid gap-2">
                  <Label htmlFor="permuta_descricao">Descrição da permuta</Label>
                  <Textarea
                    id="permuta_descricao"
                    rows={2}
                    placeholder="Ex: aceita carro até R$150 mil + diferença em dinheiro"
                    value={formData.permuta_descricao || ""}
                    onChange={(e) => handleChange("permuta_descricao", e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="pontos_fortes">Pontos fortes (um por linha)</Label>
                <Textarea
                  id="pontos_fortes"
                  rows={3}
                  placeholder={"Vista mar panorâmica\nPé na areia\nPrédio com piscina"}
                  value={arrayToText(formData.pontos_fortes)}
                  onChange={(e) => handleChange("pontos_fortes", textToArray(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pontos_atencao">Pontos de atenção (um por linha)</Label>
                <Textarea
                  id="pontos_atencao"
                  rows={3}
                  placeholder={"Condomínio alto\nSem elevador\nReforma na cozinha"}
                  value={arrayToText(formData.pontos_atencao)}
                  onChange={(e) => handleChange("pontos_atencao", textToArray(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="argumentos_venda">Argumentos de venda</Label>
                <Textarea
                  id="argumentos_venda"
                  rows={3}
                  placeholder="Texto livre que o Daniel/equipe usa para vender este imóvel"
                  value={formData.argumentos_venda || ""}
                  onChange={(e) => handleChange("argumentos_venda", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags_maria">Tags MarIA (separe por vírgula ou linha)</Label>
                <Textarea
                  id="tags_maria"
                  rows={2}
                  placeholder="pe-na-areia, familia, primeira-compra, renda-temporada"
                  value={arrayToText(formData.tags_maria)}
                  onChange={(e) => handleChange("tags_maria", textToArray(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="resumo_estrategico_ia">Resumo estratégico (para a MarIA)</Label>
                <Textarea
                  id="resumo_estrategico_ia"
                  rows={4}
                  placeholder="Resumo curto e objetivo para a MarIA usar no futuro ao recomendar o imóvel."
                  value={formData.resumo_estrategico_ia || ""}
                  onChange={(e) => handleChange("resumo_estrategico_ia", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes_internas_daniel">Observações internas (Daniel/equipe)</Label>
                <Textarea
                  id="observacoes_internas_daniel"
                  rows={3}
                  placeholder="Notas internas, contexto do proprietário, histórico de negociação…"
                  value={formData.observacoes_internas_daniel || ""}
                  onChange={(e) => handleChange("observacoes_internas_daniel", e.target.value)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>


        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
