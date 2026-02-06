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
            <Route
              path="/ong/dashboard"
              element={
                <ProtectedRoute allowedRoles={["organization"]}>
                  <OngDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ong/relatorios"
              element={
                <ProtectedRoute allowedRoles={["organization"]}>
                  <OngReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ong/novo-relatorio"
              element={
                <ProtectedRoute allowedRoles={["organization"]}>
                  <NewReport />
                </ProtectedRoute>
              }
            />

            {/* Apoiador Routes */}
            <Route
              path="/apoiador/dashboard"
              element={
                <ProtectedRoute allowedRoles={["supporter"]}>
                  <ApoiadorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
