import { NavLink, useLocation } from "react-router-dom";
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
];

const importItems = [
  { title: "Meus Imóveis", url: "/admin/imoveis", icon: ClipboardList },
  { title: "Inventário", url: "/admin/inventario", icon: PackageSearch },
  { title: "Curadoria", url: "/admin/curadoria", icon: Sparkles },
  { title: "Submissões", url: "/admin/submissions", icon: Bell },
  { title: "Importar link", url: "/admin/importar-link", icon: Link2 },
  { title: "Importar planilha", url: "/admin/importar", icon: FileSpreadsheet },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

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
            <SidebarMenuButton onClick={handleLogout} tooltip="Sair" className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}