import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Building2,
  TrendingUp,
  FileText,
  Calendar,
  Award,
  Target,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Heart,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportWithOrg {
  id: string;
  reference_month: string;
  status: string;
  participants_count: number | null;
  activities_description: string | null;
  results_achieved: string | null;
  organization_name: string;
}

interface DashboardData {
  totalOrganizations: number;
  totalReports: number;
  totalParticipants: number;
  approvedReports: number;
  draftReports: number;
  submittedReports: number;
  recentReports: ReportWithOrg[];
  organizationNames: string[];
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  draft: { label: "Rascunho", className: "status-draft", icon: Clock },
  submitted: { label: "Enviado", className: "status-submitted", icon: CheckCircle2 },
  pending: { label: "Pendente", className: "status-pending", icon: AlertCircle },
  approved: { label: "Aprovado", className: "status-approved", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", className: "status-rejected", icon: AlertCircle },
};

const ApoiadorDashboard = () => {
  const { user } = useAuth();
  const [supporterName, setSupporterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalOrganizations: 0,
    totalReports: 0,
    totalParticipants: 0,
    approvedReports: 0,
    draftReports: 0,
    submittedReports: 0,
    recentReports: [],
    organizationNames: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: supporterData } = await supabase
        .from("supporters")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (supporterData) {
        setSupporterName(supporterData.name);
      }

      const { count: orgCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      const { data: orgsData } = await supabase
        .from("organizations")
        .select("name")
        .limit(10);

      const { data: reportsData } = await supabase
        .from("monthly_reports")
        .select(`
          id,
          reference_month,
          status,
          participants_count,
          activities_description,
          results_achieved,
          organizations (name)
        `)
        .order("created_at", { ascending: false });

      if (reportsData) {
        const totalParticipants = reportsData.reduce(
          (acc, r) => acc + (r.participants_count || 0),
          0
        );
        const approvedCount = reportsData.filter(
          (r) => r.status === "approved" || r.status === "submitted"
        ).length;
        const draftCount = reportsData.filter((r) => r.status === "draft").length;

        const recentReports = reportsData.slice(0, 6).map((r) => ({
          id: r.id,
          reference_month: r.reference_month,
          status: r.status,
          organization_name: (r.organizations as { name: string })?.name || "Organização",
          participants_count: r.participants_count,
          activities_description: r.activities_description,
          results_achieved: r.results_achieved,
        }));

        setData({
          totalOrganizations: orgCount || 0,
          totalReports: reportsData.length,
          totalParticipants,
          approvedReports: approvedCount,
          draftReports: draftCount,
          submittedReports: approvedCount,
          recentReports,
          organizationNames: orgsData?.map((o) => o.name) || [],
        });
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

  const statusDistribution = [
    { label: "Enviados", count: data.submittedReports, color: "bg-success" },
    { label: "Rascunhos", count: data.draftReports, color: "bg-warning" },
    { label: "Outros", count: data.totalReports - data.submittedReports - data.draftReports, color: "bg-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {supporterName || "Apoiador"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o impacto dos projetos que você apoia.
            </p>
          </div>
          <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm">
            <Heart className="w-4 h-4 mr-2" />
            Apoiador Garra
          </Badge>
        </div>

        {/* Impact Hero Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{data.totalOrganizations}</p>
                  <p className="text-sm text-muted-foreground">Organizações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{data.totalParticipants.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Beneficiários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{data.totalReports}</p>
                  <p className="text-sm text-muted-foreground">Relatórios</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{data.approvedReports}</p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Impact Card */}
          <Card className="bg-hero-gradient text-primary-foreground lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Impacto Social Total</h3>
                  <p className="text-5xl font-bold mb-2">{data.totalParticipants.toLocaleString()}</p>
                  <p className="text-sm opacity-80">
                    pessoas impactadas por {data.totalOrganizations} organização(ões)
                  </p>
                </div>
                <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Target className="w-10 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Status dos Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.count}</span>
                    </div>
                    <Progress
                      value={data.totalReports > 0 ? (item.count / data.totalReports) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations List */}
        {data.organizationNames.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Organizações Apoiadas
              </CardTitle>
              <CardDescription>Instituições que recebem seu apoio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.organizationNames.map((name, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">
                    <Building2 className="w-3 h-3 mr-1.5" />
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Relatórios Recentes
            </CardTitle>
            <CardDescription>
              Últimos relatórios enviados pelas organizações parceiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhum relatório disponível ainda.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {data.recentReports.map((report) => {
                  const status = statusConfig[report.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{report.organization_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${status.className} text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      {report.participants_count && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Users className="w-3 h-3" />
                          {report.participants_count} beneficiários
                        </div>
                      )}
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

export default ApoiadorDashboard;
