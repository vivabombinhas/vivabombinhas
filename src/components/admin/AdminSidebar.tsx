import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ClipboardList,
  Link2,
  FileSpreadsheet,
  LogOut,
  CalendarClock,
  Bell,
  DollarSign,
  Settings,
  LineChart as ChartIcon,
  PackageSearch,
  Activity,
  MessageSquare,
  KanbanSquare,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Insights", url: "/admin/insights", icon: ChartIcon },
  { title: "Central de Avisos", url: "/admin/alerts", icon: Bell, badgeKey: "alerts" as const },
  { title: "Follow-ups", url: "/admin/followups", icon: CalendarClock, badgeKey: "followups" as const },
  { title: "Leads", url: "/admin/leads", icon: Users },
  { title: "Matches", url: "/admin/matches", icon: Sparkles },
  { title: "Receita", url: "/admin/receita", icon: DollarSign },
  { title: "Configuração IA", url: "/admin/ai-config", icon: Settings },
  { title: "MarIA Core", url: "/admin/maria-core", icon: Activity },
  { title: "Conversas", url: "/admin/conversas", icon: MessageSquare },
  { title: "Funil", url: "/admin/funil", icon: KanbanSquare },
  { title: "Atendimento", url: "/admin/atendimento", icon: Inbox },
];

const importItems = [
  { title: "Meus Imóveis", url: "/admin/imoveis", icon: ClipboardList },
  { title: "Inventário", url: "/admin/inventario", icon: PackageSearch },
  // "Curadoria" aposentada: duplicava os toggles de "Meus Imóveis → Editar"
  // (Destaque Premium / Ocultar da MarIA) com rótulo invertido. Rota preservada.
  { title: "Submissões", url: "/admin/submissions", icon: Bell },
  { title: "Importar link", url: "/admin/importar-link", icon: Link2 },
  { title: "Importar planilha", url: "/admin/importar", icon: FileSpreadsheet },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPw.length < 6) return toast.error("Mínimo 6 caracteres");
    if (newPw !== confirmPw) return toast.error("As senhas não coincidem");
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso");
    setNewPw(""); setConfirmPw(""); setPwOpen(false);
  };

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  // Badge: leads com follow-up vencido ou para hoje
  const { data: followupBadge } = useQuery({
    queryKey: ["sidebar_followup_badge"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const { count } = await supabase
        .from("leads_maria")
        .select("id", { count: "exact", head: true })
        .not("next_followup_at", "is", null)
        .lte("next_followup_at", endOfToday.toISOString())
        .neq("status", "convertido")
        .neq("status", "descartado")
        .neq("status", "anonimo");
      return count ?? 0;
    },
  });

  // Badge: Alertas não lidos na Central de Avisos
  const { data: alertsBadge } = useQuery({
    queryKey: ["sidebar_alerts_badge"],
    refetchInterval: 10_000, // Mais frequente para avisos real-time
    queryFn: async () => {
      const { count } = await supabase
        .from("broker_notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
  });

  const badges: Record<string, number | undefined> = {
    followups: followupBadge,
    alerts: alertsBadge,
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight truncate">Viva Bombinhas</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">CRM Admin</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                      <NavLink to={item.url} end={item.exact} className="flex items-center w-full">
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1">{item.title}</span>
                        {!collapsed && badge && badge > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Imóveis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {importItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setPwOpen(true)} tooltip="Alterar senha">
              <KeyRound className="w-4 h-4" />
              <span>Alterar senha</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sair" className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-pw">Nova senha</Label>
              <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirmar nova senha</Label>
              <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} minLength={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}