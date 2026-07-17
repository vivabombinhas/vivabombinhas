import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PauseCircle } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  ExternalLink,
  Plus,
  RefreshCw,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PropertyEditSheet } from "@/components/admin/PropertyEditSheet";
import { PropertyPhotoGallery } from "@/components/admin/PropertyPhotoGallery";

export default function AdminImoveis() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProperty, setEditProperty] = useState<any | null>(null);
  const [galleryProperty, setGalleryProperty] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<null | "deactivate" | "delete">(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: imoveis, isLoading, error: imoveisError } = useQuery({
    queryKey: ["admin_imoveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("imoveis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_imoveis"] });
      toast({ title: "Imóvel excluído com sucesso" });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir imóvel", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("imoveis").update({ status: "pausado" }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin_imoveis"] });
      toast({ title: `${ids.length} imóvel(is) desativado(s)` });
      setSelectedIds(new Set());
      setBulkAction(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao desativar", description: error.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("imoveis").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin_imoveis"] });
      toast({ title: `${ids.length} imóvel(is) excluído(s)` });
      setSelectedIds(new Set());
      setBulkAction(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const [refreshingId, setRefreshingId] = useState<string | null>(null);


  const handleRefreshPhotos = async (imovel: any) => {
    if (!imovel.link_anuncio) {
      toast({ 
        title: "Link não disponível", 
        description: "Este imóvel não possui um link de anúncio.",
        variant: "destructive"
      });
      return;
    }

    setRefreshingId(imovel.id);
    try {
      const { data, error } = await supabase.functions.invoke("extract-property-from-link", {
        body: { url: imovel.link_anuncio }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro desconhecido");

      const newPhotos = data.data.fotos || [];
      
      const { error: updateError } = await supabase
        .from("imoveis")
        .update({ fotos: newPhotos })
        .eq("id", imovel.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["admin_imoveis"] });
      toast({ title: "Fotos atualizadas!", description: `${newPhotos.length} imagens extraídas.` });
    } catch (error: any) {
      toast({ 
        title: "Erro ao reprocessar fotos", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const filteredImoveis = imoveis?.filter(i => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch = 
      (i.titulo ?? "").toLowerCase().includes(normalizedSearch) ||
      (i.bairro ?? "").toLowerCase().includes(normalizedSearch) ||
      (i.codigo ?? "").toLowerCase().includes(normalizedSearch);
    
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    
    const hasPhotos = i.fotos && i.fotos.length > 0 && !i.fotos[0].includes("unsplash.com") && !i.fotos[0].includes("placeholder");
    const hasPhone = i.anunciante_telefone && i.anunciante_telefone.trim() !== "";
    const hasPrice = i.preco !== null || i.preco_temporada_diaria !== null;
    const isQuality = hasPhotos && hasPhone && hasPrice;

    const matchesQuality = qualityFilter === "all" || 
      (qualityFilter === "quality" && isQuality) ||
      (qualityFilter === "incomplete" && !isQuality);

    return matchesSearch && matchesStatus && matchesQuality;
  });

  const filteredIds = useMemo(() => filteredImoveis?.map((i) => i.id) ?? [], [filteredImoveis]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));
  const selectedCount = selectedIds.size;

  const toggleSelectAll = (checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) filteredIds.forEach((id) => next.add(id));
    else filteredIds.forEach((id) => next.delete(id));
    setSelectedIds(next);
  };
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };



  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Meus Imóveis</h1>
          <p className="text-muted-foreground text-sm">Gerencie os imóveis ativos no sistema</p>
        </div>
        <Button onClick={() => setEditProperty({})} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Imóvel
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, bairro ou código..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="pausado">Pausados</SelectItem>
              <SelectItem value="removido">Removidos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Qualidade" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer Qualidade</SelectItem>
              <SelectItem value="quality">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Alta Qualidade
                </div>
              </SelectItem>
              <SelectItem value="incomplete">
                <div className="flex items-center gap-2 text-amber-600">
                  <XCircle className="w-4 h-4" />
                  Incompletos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
          <div className="text-sm">
            <span className="font-semibold">{selectedCount}</span> selecionado{selectedCount > 1 ? "s" : ""}
            <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => setSelectedIds(new Set())}>
              Limpar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkAction("deactivate")}>
              <PauseCircle className="w-4 h-4" /> Desativar
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setBulkAction("delete")}>
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                  onCheckedChange={(c) => toggleSelectAll(!!c)}
                  aria-label="Selecionar todos os filtrados"
                />
              </TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Bairro</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Carregando...</TableCell>
              </TableRow>
            ) : imoveisError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-destructive">
                  Erro ao carregar imóveis: {(imoveisError as Error).message}
                </TableCell>
              </TableRow>
            ) : filteredImoveis?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum imóvel encontrado</TableCell>
              </TableRow>
            ) : (
              filteredImoveis?.map((imovel) => (
                <TableRow key={imovel.id} data-state={selectedIds.has(imovel.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(imovel.id)}
                      onCheckedChange={(c) => toggleOne(imovel.id, !!c)}
                      aria-label="Selecionar imóvel"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{imovel.titulo}</div>

                      {imovel.destaque_premium && (
                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-bold">
                          PREMIUM
                        </Badge>
                      )}
                      {imovel.oculta_para_maria && (
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-300">
                          Oculto MarIA
                        </Badge>
                      )}
                      {imovel.gestao_propria && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          Próprio
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{imovel.tipo} · {imovel.finalidade}</div>
                  </TableCell>
                  <TableCell>
                    {imovel.preco ? (
                      <span className="font-medium text-primary">
                        R$ {Number(imovel.preco).toLocaleString("pt-BR")}
                      </span>
                    ) : imovel.preco_temporada_diaria ? (
                      <span className="font-medium text-primary">
                        R$ {Number(imovel.preco_temporada_diaria).toLocaleString("pt-BR")} /dia
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={imovel.status === "ativo" ? "default" : "secondary"}>
                      {imovel.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{imovel.bairro}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditProperty(imovel)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGalleryProperty(imovel)}>
                          <ImageIcon className="mr-2 h-4 w-4" /> Fotos ({imovel.fotos?.length || 0})
                        </DropdownMenuItem>
                        {imovel.link_anuncio && (
                          <DropdownMenuItem 
                            onClick={() => handleRefreshPhotos(imovel)}
                            disabled={refreshingId === imovel.id}
                          >
                            {refreshingId === imovel.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Reprocessar Fotos
                          </DropdownMenuItem>
                        )}
                        {imovel.link_anuncio && (
                          <DropdownMenuItem asChild>
                            <a href={imovel.link_anuncio} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Ver original
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(imovel.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o imóvel e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!bulkAction} onOpenChange={(o) => !o && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "delete"
                ? `Excluir ${selectedCount} imóvel(is)?`
                : `Desativar ${selectedCount} imóvel(is)?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "delete"
                ? `Esta ação não pode ser desfeita. ${selectedCount} imóvel(is) e seus dados associados serão removidos permanentemente. Se quiser apenas tirá-los do ar, prefira "Desativar".`
                : `${selectedCount} imóvel(is) terão status alterado para "pausado" e sairão da MarIA e da vitrine. Você pode reativá-los depois.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const ids = Array.from(selectedIds);
                if (bulkAction === "delete") bulkDeleteMutation.mutate(ids);
                else bulkDeactivateMutation.mutate(ids);
              }}
              className={bulkAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {bulkAction === "delete" ? "Excluir definitivamente" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {editProperty && (
        <PropertyEditSheet
          property={editProperty}
          open={!!editProperty}
          onOpenChange={(open) => !open && setEditProperty(null)}
        />
      )}

      {galleryProperty && (
        <PropertyPhotoGallery
          property={galleryProperty}
          open={!!galleryProperty}
          onOpenChange={(open) => !open && setGalleryProperty(null)}
        />
      )}
    </div>
  );
}
