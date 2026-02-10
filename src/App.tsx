import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// ONG Pages
import OngDashboard from "./pages/ong/Dashboard";
import OngReports from "./pages/ong/Reports";
import NewReport from "./pages/ong/NewReport";
import PendingReports from "./pages/ong/PendingReports";
import Indicators from "./pages/ong/Indicators";

// Apoiador Pages
import ApoiadorDashboard from "./pages/apoiador/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* ONG Routes */}
            <Route path="/ong/dashboard" element={<OngDashboard />} />
            <Route path="/ong/relatorios" element={<OngReports />} />
            <Route path="/ong/novo-relatorio" element={<NewReport />} />
            <Route path="/ong/pendentes" element={<PendingReports />} />
            <Route path="/ong/indicadores" element={<Indicators />} />

            {/* Apoiador Routes */}
            <Route path="/apoiador/dashboard" element={<ApoiadorDashboard />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
