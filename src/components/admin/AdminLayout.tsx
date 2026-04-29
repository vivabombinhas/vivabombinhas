import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";

export default function AdminLayout() {
  return (
    <ProtectedAdminRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-2 gap-2">
              <SidebarTrigger />
              <div className="text-xs text-muted-foreground hidden sm:block">
                Painel administrativo
              </div>
            </header>
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedAdminRoute>
  );
}
