import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ClipboardList,
  Link2,
  FileSpreadsheet,
  LogOut,
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
  { title: "Leads", url: "/admin/leads", icon: Users },
  { title: "Matches", url: "/admin/matches", icon: Sparkles },
];

const importItems = [
  { title: "Submissões", url: "/admin/submissions", icon: ClipboardList },
  { title: "Importar link", url: "/admin/importar-link", icon: Link2 },
  { title: "Importar planilha", url: "/admin/importar", icon: FileSpreadsheet },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

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
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.exact}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
