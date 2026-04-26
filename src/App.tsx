import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MariaChat from "./pages/MariaChat.tsx";
import Anunciar from "./pages/Anunciar.tsx";
import AdminLeads from "./pages/AdminLeads.tsx";
import AdminSubmissions from "./pages/AdminSubmissions.tsx";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute.tsx";
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
          <Route path="/admin/leads" element={<ProtectedAdminRoute><AdminLeads /></ProtectedAdminRoute>} />
          <Route path="/admin/submissions" element={<ProtectedAdminRoute><AdminSubmissions /></ProtectedAdminRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
