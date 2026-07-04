import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MariaChat from "./pages/MariaChat.tsx";
import Anunciar from "./pages/Anunciar.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CheckoutSimulado from "./pages/CheckoutSimulado.tsx";
import AdminLeads from "./pages/AdminLeads.tsx";
import AdminSubmissions from "./pages/AdminSubmissions.tsx";
import AdminImportar from "./pages/AdminImportar.tsx";
import AdminImportarLink from "./pages/AdminImportarLink.tsx";
import AdminMatches from "./pages/AdminMatches.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminFollowups from "./pages/AdminFollowups.tsx";
import AdminAlerts from "./pages/AdminAlerts.tsx";
import AdminRevenue from "./pages/AdminRevenue.tsx";
import AdminAIConfig from "./pages/AdminAIConfig.tsx";
import AdminMariaCore from "./pages/AdminMariaCore.tsx";
import AdminImoveis from "./pages/AdminImoveis.tsx";
import AdminCuradoria from "./pages/AdminCuradoria.tsx";
import AdminInventario from "./pages/AdminInventario.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminInsights from "./pages/AdminInsights.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import UseCases from "./pages/UseCases.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/maria" element={<MariaChat />} />
          <Route path="/anuncie" element={<Anunciar />} />
          <Route path="/casos-de-uso" element={<UseCases />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/destacar/:submissionId" element={<CheckoutSimulado />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="insights" element={<AdminInsights />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="followups" element={<AdminFollowups />} />
            <Route path="alerts" element={<AdminAlerts />} />
            <Route path="receita" element={<AdminRevenue />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="imoveis" element={<AdminImoveis />} />
            <Route path="inventario" element={<AdminInventario />} />
            <Route path="curadoria" element={<AdminCuradoria />} />
            <Route path="importar" element={<AdminImportar />} />
            <Route path="importar-link" element={<AdminImportarLink />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="ai-config" element={<AdminAIConfig />} />
            <Route path="maria-core" element={<AdminMariaCore />} />
          </Route>
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
