import { AdminPageBanner } from "@/components/admin/AdminPageBanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  Check, 
  Trash2, 
  User, 
  Phone, 
  Calendar,
  MessageSquare,
  ChevronRight,
  Search,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminAlerts() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["broker_notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_notifications")
        .select("*, leads_maria(nome, telefone, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: spikes, isLoading: isLoadingSpikes } = useQuery({
    queryKey: ["filter_spikes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_maria_filter_spikes");
      if (error) throw error;
      return data;
    },
    refetchInterval: 300000, // Check every 5 mins
  });

  const isLoading = isLoadingNotifications || isLoadingSpikes;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("broker_notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker_notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin_dashboard_stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker_notifications"] });
      toast({ title: "Notificação removida" });
    },
  });

  const filtered = notifications?.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase()) ||
    n.leads_maria?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const handleWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${clean}`, "_blank");
  };

  return (
    <div className="container py-6 space-y-6">
      <AdminPageBanner
        title="Central de avisos"
        description="Notificações em tempo real: lead novo, follow-up urgente, mensagem no WhatsApp. Comece o dia por aqui — resolveu, marca como lido."
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Central de Avisos
          </h1>
          <p className="text-muted-foreground text-sm">Acompanhe leads qualificados em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const unread = notifications?.filter(n => !n.read).map(n => n.id);
              if (unread?.length) {
                unread.forEach(id => markAsReadMutation.mutate(id));
              }
            }}
          >
            Marcar tudo como lido
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificações..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {spikes && spikes.length > 0 && (
        <div className="grid gap-4 mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Comportamento (Spikes de Desistência)
          </h2>
          {spikes.map((spike: any, idx: number) => (
            <div key={idx} className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-destructive">Aumento de desistência: Faltando {spike.filter_name}</h3>
                <p className="text-sm text-destructive/80">
                  Houve um aumento de <strong>{spike.spike_percentage.toFixed(0)}%</strong> nas últimas 24h ({spike.current_count} ocorrências vs {spike.previous_count} no período anterior).
                </p>
              </div>
              <Button size="sm" variant="destructive" asChild>
                <a href="/admin/insights">Ver Insights</a>
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed rounded-xl">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação encontrada.</p>
          </div>
        ) : (
          filtered?.map((n) => (
            <div 
              key={n.id}
              className={`relative bg-card border rounded-xl p-4 transition-all hover:shadow-md ${!n.read ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
            >
              {!n.read && <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />}
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{n.title}</h3>
                    <Badge variant={n.read ? "secondary" : "default"} className="text-[10px] uppercase">
                      {n.read ? "Lido" : "Novo Lead"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {n.leads_maria?.nome || "Lead Anonimo"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </div>
                    {n.leads_maria?.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {n.leads_maria.telefone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  {!n.read && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 gap-1 text-xs"
                      onClick={() => markAsReadMutation.mutate(n.id)}
                    >
                      <Check className="w-3.5 h-3.5" /> Lido
                    </Button>
                  )}
                  {n.leads_maria?.telefone && (
                    <Button 
                      size="sm" 
                      className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleWhatsApp(n.leads_maria.telefone)}
                    >
                      <Phone className="w-3.5 h-3.5" /> WhatsApp
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(n.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}