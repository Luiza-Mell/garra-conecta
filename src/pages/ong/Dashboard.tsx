import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { startOfMonth, addMonths, isBefore, parseISO, format as fnsFormat } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
  Target,
  BarChart3,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { format, startOfYear, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Report {
  id: string;
  reference_month: string;
  status: string;
  created_at: string;
  participants_count: number | null;
  activities_description: string | null;
  challenges: string | null;
  results_achieved: string | null;
  funds_usage: string | null;
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
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, registration_completed, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      // Redirect to registration if not completed
      if (orgData && !(orgData as any).registration_completed) {
        navigate("/ong/cadastro");
        return;
      }

      if (orgData) {
        setOrganization(orgData);

        const { data: reportsData } = await supabase
          .from("monthly_reports")
          .select("id, reference_month, status, created_at, participants_count, activities_description, challenges, results_achieved, funds_usage")
          .eq("organization_id", orgData.id)
          .order("reference_month", { ascending: false });

        if (reportsData) {
          setAllReports(reportsData);
          setReports(reportsData.slice(0, 5));

          // Calculate missing months
          const registrationDate = parseISO(orgData.created_at);
          const registrationMonth = startOfMonth(registrationDate);
          const currentMonth = startOfMonth(new Date());
          const existingMonths = new Set(reportsData.map((r: Report) => r.reference_month.slice(0, 7)));
          let count = 0;
          let checkMonth = registrationMonth;
          while (isBefore(checkMonth, currentMonth) || checkMonth.getTime() === currentMonth.getTime()) {
            const monthKey = fnsFormat(checkMonth, "yyyy-MM");
            if (!existingMonths.has(monthKey)) count++;
            checkMonth = addMonths(checkMonth, 1);
          }
          setMissingCount(count);
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

  const yearStart = startOfYear(new Date());
  const reportsThisYear = allReports.filter((r) =>
    isAfter(new Date(r.reference_month), yearStart)
  );
  const currentMonth = new Date().getMonth() + 1;
  const completionRate = currentMonth > 0 ? Math.round((reportsThisYear.length / currentMonth) * 100) : 0;

  const stats = {
    totalReports: allReports.length,
    submittedReports: allReports.filter((r) => r.status === "submitted" || r.status === "approved").length,
    draftReports: allReports.filter((r) => r.status === "draft").length,
    totalParticipants: allReports.reduce((acc, r) => acc + (r.participants_count || 0), 0),
    reportsWithActivities: allReports.filter((r) => r.activities_description).length,
    reportsWithChallenges: allReports.filter((r) => r.challenges).length,
    reportsWithFinancial: allReports.filter((r) => r.funds_usage).length,
  };

  const monthlyParticipants = reportsThisYear
    .filter((r) => r.participants_count)
    .map((r) => ({
      month: format(new Date(r.reference_month), "MMM", { locale: ptBR }),
      count: r.participants_count || 0,
    }))
    .reverse();

  const maxParticipants = Math.max(...monthlyParticipants.map((m) => m.count), 1);

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
              Acompanhe seus relatórios e indicadores de impacto.
            </p>
          </div>
          <Button asChild className="shadow-md">
            <Link to="/ong/novo-relatorio">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Relatório
            </Link>
          </Button>
        </div>

        {/* Alert for missing reports */}
        {missingCount > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">
                      {missingCount} relatório(s) pendente(s)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Você possui meses sem relatório enviado. Envie-os para manter o acompanhamento em dia.
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" asChild>
                  <Link to="/ong/pendentes">Ver Pendentes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalReports}</p>
                  <p className="text-xs text-muted-foreground">Relatórios Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.submittedReports}</p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.draftReports}</p>
                  <p className="text-xs text-muted-foreground">Rascunhos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalParticipants.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Beneficiários</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Completion Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Taxa de Envio Anual
              </CardTitle>
              <CardDescription>Relatórios enviados vs meses do ano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-foreground">{Math.min(completionRate, 100)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {reportsThisYear.length}/{currentMonth} meses
                  </p>
                </div>
                <Progress value={Math.min(completionRate, 100)} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {completionRate >= 100
                    ? "Todos os relatórios em dia!"
                    : `Faltam ${currentMonth - reportsThisYear.length} relatório(s) para ficar em dia`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Beneficiaries Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Beneficiários por Mês
              </CardTitle>
              <CardDescription>Evolução mensal {new Date().getFullYear()}</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum dado de beneficiários registrado
                </p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {monthlyParticipants.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-foreground">{m.count}</span>
                      <div
                        className="w-full bg-primary/80 rounded-t-md transition-all"
                        style={{ height: `${(m.count / maxParticipants) * 100}%`, minHeight: "4px" }}
                      />
                      <span className="text-[10px] text-muted-foreground capitalize">{m.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Quality */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Qualidade dos Relatórios
              </CardTitle>
              <CardDescription>Preenchimento das seções</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Atividades</span>
                    <span className="font-medium text-foreground">
                      {allReports.length > 0 ? Math.round((stats.reportsWithActivities / allReports.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={allReports.length > 0 ? (stats.reportsWithActivities / allReports.length) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desafios</span>
                    <span className="font-medium text-foreground">
                      {allReports.length > 0 ? Math.round((stats.reportsWithChallenges / allReports.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={allReports.length > 0 ? (stats.reportsWithChallenges / allReports.length) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Financeiro</span>
                    <span className="font-medium text-foreground">
                      {allReports.length > 0 ? Math.round((stats.reportsWithFinancial / allReports.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={allReports.length > 0 ? (stats.reportsWithFinancial / allReports.length) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Relatórios Recentes
                </CardTitle>
                <CardDescription>
                  Seus últimos relatórios enviados e em andamento
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ong/relatorios">
                  Ver todos
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
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
                            {report.participants_count && (
                              <span> • {report.participants_count} beneficiários</span>
                            )}
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
