import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Report {
  id: string;
  reference_month: string;
  status: string;
  created_at: string;
  participants_count: number | null;
}

interface Organization {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  draft: { label: "Rascunho", className: "status-draft", icon: Clock },
  submitted: { label: "Enviado", className: "status-submitted", icon: CheckCircle2 },
  pending: { label: "Pendente", className: "status-pending", icon: AlertCircle },
  approved: { label: "Aprovado", className: "status-approved", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", className: "status-rejected", icon: AlertCircle },
};

const OngDashboard = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch organization
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgData) {
        setOrganization(orgData);

        // Fetch reports
        const { data: reportsData } = await supabase
          .from("monthly_reports")
          .select("id, reference_month, status, created_at, participants_count")
          .eq("organization_id", orgData.id)
          .order("reference_month", { ascending: false })
          .limit(5);

        if (reportsData) {
          setReports(reportsData);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    totalReports: reports.length,
    submittedReports: reports.filter(r => r.status === "submitted" || r.status === "approved").length,
    draftReports: reports.filter(r => r.status === "draft").length,
    totalParticipants: reports.reduce((acc, r) => acc + (r.participants_count || 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {organization?.name || "Organização"}!
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seus relatórios e envie novos dados mensais.
            </p>
          </div>
          <Button asChild>
            <Link to="/ong/novo-relatorio">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Relatório
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalReports}</p>
                  <p className="text-xs text-muted-foreground">Relatórios Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.submittedReports}</p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.draftReports}</p>
                  <p className="text-xs text-muted-foreground">Rascunhos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalParticipants}</p>
                  <p className="text-xs text-muted-foreground">Beneficiários</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Relatórios Recentes
            </CardTitle>
            <CardDescription>
              Seus últimos relatórios enviados e em andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  Você ainda não enviou nenhum relatório.
                </p>
                <Button asChild>
                  <Link to="/ong/novo-relatorio">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Criar Primeiro Relatório
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => {
                  const status = statusConfig[report.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Relatório de{" "}
                            {format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Criado em {format(new Date(report.created_at), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={status.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/ong/relatorio/${report.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OngDashboard;
