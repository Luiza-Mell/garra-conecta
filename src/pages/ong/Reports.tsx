import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Report {
  id: string;
  reference_month: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  participants_count: number | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  draft: { label: "Rascunho", className: "status-draft", icon: Clock },
  submitted: { label: "Enviado", className: "status-submitted", icon: CheckCircle2 },
  pending: { label: "Pendente", className: "status-pending", icon: AlertCircle },
  approved: { label: "Aprovado", className: "status-approved", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", className: "status-rejected", icon: AlertCircle },
};

const OngReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgData) {
        const { data: reportsData } = await supabase
          .from("monthly_reports")
          .select("id, reference_month, status, created_at, submitted_at, participants_count")
          .eq("organization_id", orgData.id)
          .order("reference_month", { ascending: false });

        if (reportsData) {
          setReports(reportsData);
        }
      }

      setLoading(false);
    };

    fetchReports();
  }, [user]);

  const filteredReports = reports.filter((report) => {
    const monthMatch = format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "all" || report.status === statusFilter;
    return monthMatch && statusMatch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Relatórios</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os seus relatórios mensais.
            </p>
          </div>
          <Button asChild>
            <Link to="/ong/novo-relatorio">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Relatório
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mês..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                >
                  Rascunhos
                </Button>
                <Button
                  variant={statusFilter === "submitted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("submitted")}
                >
                  Enviados
                </Button>
                <Button
                  variant={statusFilter === "approved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("approved")}
                >
                  Aprovados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Relatórios</CardTitle>
            <CardDescription>
              {filteredReports.length} relatório(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhum relatório encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => {
                  const status = statusConfig[report.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={report.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Relatório de{" "}
                            {format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })}
                          </p>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>
                              Criado em {format(new Date(report.created_at), "dd/MM/yyyy")}
                            </span>
                            {report.submitted_at && (
                              <span>
                                • Enviado em {format(new Date(report.submitted_at), "dd/MM/yyyy")}
                              </span>
                            )}
                            {report.participants_count && (
                              <span>• {report.participants_count} beneficiários</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-16 sm:ml-0">
                        <Badge className={status.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/ong/relatorio/${report.id}`}>
                            {report.status === "draft" ? "Continuar" : "Ver Detalhes"}
                          </Link>
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

export default OngReports;
