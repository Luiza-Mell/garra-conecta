import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  LogOut,
  Menu,
  X,
  User,
  Building2,
  HandHeart,
  Clock,
  Bell,
  HelpCircle,
  Settings,
  BarChart3,
} from "lucide-react";
import ChatBot from "@/components/ChatBot";
import WhatsAppButton from "@/components/WhatsAppButton";
import logoGarra from "@/assets/logo-instituto-garra.svg";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      if (!user) return;

      if (userRole === "organization") {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (orgData) {
          const { count } = await supabase
            .from("monthly_reports")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", orgData.id)
            .eq("status", "draft");
          setPendingCount(count || 0);
        }
      }
    };

    fetchPending();
  }, [user, userRole]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const orgNavItems = [
    { href: "/ong/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ong/relatorios", label: "Relatórios", icon: FileText },
    {
      href: "/ong/pendentes",
      label: "Pendentes",
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { href: "/ong/novo-relatorio", label: "Novo Relatório", icon: PlusCircle },
    { href: "/ong/indicadores", label: "Indicadores", icon: BarChart3 },
  ];

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/revisao", label: "Revisão de Relatórios", icon: FileText },
    { href: "/admin/organizacoes", label: "Organizações", icon: Building2 },
  ];

  const navItems = userRole === "organization" ? orgNavItems : adminNavItems;
  const roleLabel = userRole === "organization" ? "Organização" : "Administrador";
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <span className="font-bold text-foreground">Instituto Garra</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {userRole === "organization" ? (
                  <Building2 className="w-5 h-5 text-primary" />
                ) : (
                  <HandHeart className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || "Visitante"}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Menu Principal
            </p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {"badge" in item && (item as { badge?: number }).badge && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[1.25rem] flex items-center justify-center">
                      {(item as { badge?: number }).badge}
                    </Badge>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Suporte
              </p>
              <a
                href="https://wa.me/5511998162471?text=Olá! Preciso de ajuda com a plataforma do Instituto Garra."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Central de Ajuda
              </a>
            </div>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Floating elements */}
      <WhatsAppButton />
      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
