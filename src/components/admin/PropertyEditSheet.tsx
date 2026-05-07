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

  const handleSave = () => {
    if (!formData.titulo) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    mutation.mutate(formData);
  };

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
