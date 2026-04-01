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
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

// ONG Pages
import OngDashboard from "./pages/ong/Dashboard";
import OngReports from "./pages/ong/Reports";
import NewReport from "./pages/ong/NewReport";
import PendingReports from "./pages/ong/PendingReports";
import Indicators from "./pages/ong/Indicators";
import OngProfile from "./pages/ong/Profile";
import OngRegistration from "./pages/ong/Registration";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ReviewReports from "./pages/admin/ReviewReports";
import AdminOrganizations from "./pages/admin/Organizations";
import AdminOrganizationDetail from "./pages/admin/OrganizationDetail";

// Supporter Pages
import SupporterDashboard from "./pages/supporter/Dashboard";
import SupporterProfile from "./pages/supporter/Profile";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/alterar-senha" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />

            {/* ONG Routes */}
            <Route path="/ong/cadastro" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <OngRegistration />
              </ProtectedRoute>
            } />
            <Route path="/ong/dashboard" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <OngDashboard />
              </ProtectedRoute>
            } />
            <Route path="/ong/relatorios" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <OngReports />
              </ProtectedRoute>
            } />
            <Route path="/ong/novo-relatorio" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <NewReport />
              </ProtectedRoute>
            } />
            <Route path="/ong/relatorio/:id" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <NewReport />
              </ProtectedRoute>
            } />
            <Route path="/ong/pendentes" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <PendingReports />
              </ProtectedRoute>
            } />
            <Route path="/ong/indicadores" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <Indicators />
              </ProtectedRoute>
            } />
            <Route path="/ong/perfil" element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <OngProfile />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/revisao" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ReviewReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/organizacoes" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminOrganizations />
              </ProtectedRoute>
            } />
            <Route path="/admin/organizacao/:id" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminOrganizationDetail />
              </ProtectedRoute>
            } />

            {/* Supporter Routes */}
            <Route path="/apoiador/dashboard" element={
              <ProtectedRoute allowedRoles={["supporter"]}>
                <SupporterDashboard />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
