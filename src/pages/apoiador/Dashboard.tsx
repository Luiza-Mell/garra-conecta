import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Building2, 
  TrendingUp,
  FileText,
  Calendar,
  Award,
  Target,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  totalOrganizations: number;
  totalReports: number;
  totalParticipants: number;
  approvedReports: number;
  recentReports: Array<{
    id: string;
    reference_month: string;
    status: string;
    organization_name: string;
    participants_count: number | null;
  }>;
}

const ApoiadorDashboard = () => {
  const { user } = useAuth();
  const [supporterName, setSupporterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalOrganizations: 0,
    totalReports: 0,
    totalParticipants: 0,
    approvedReports: 0,
    recentReports: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch supporter info
      const { data: supporterData } = await supabase
        .from("supporters")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (supporterData) {
        setSupporterName(supporterData.name);
      }

      // Fetch organizations count
      const { count: orgCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      // Fetch all reports with organization names
      const { data: reportsData } = await supabase
        .from("monthly_reports")
        .select(`
          id,
          reference_month,
          status,
          participants_count,
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

        const recentReports = reportsData.slice(0, 5).map((r) => ({
          id: r.id,
          reference_month: r.reference_month,
          status: r.status,
          organization_name: (r.organizations as { name: string })?.name || "Organização",
          participants_count: r.participants_count,
        }));

        setData({
          totalOrganizations: orgCount || 0,
          totalReports: reportsData.length,
          totalParticipants,
          approvedReports: approvedCount,
          recentReports,
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

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Rascunho", className: "status-draft" },
    submitted: { label: "Enviado", className: "status-submitted" },
    pending: { label: "Pendente", className: "status-pending" },
    approved: { label: "Aprovado", className: "status-approved" },
    rejected: { label: "Rejeitado", className: "status-rejected" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {supporterName || "Apoiador"}!
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o impacto dos projetos que você apoia.
          </p>
        </div>

        {/* Impact Summary */}
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

        {/* Impact Highlights */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Impact Card */}
          <Card className="bg-hero-gradient text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Impacto Total</h3>
                  <p className="text-4xl font-bold mb-1">{data.totalParticipants.toLocaleString()}</p>
                  <p className="text-sm opacity-80">pessoas impactadas pelos projetos</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Target className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Relatórios Recebidos</h3>
                  <p className="text-4xl font-bold text-foreground mb-1">{data.totalReports}</p>
                  <p className="text-sm text-muted-foreground">relatórios de acompanhamento</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
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
              <div className="space-y-3">
                {data.recentReports.map((report) => {
                  const status = statusConfig[report.status] || statusConfig.draft;
                  return (
                    <div
                      key={report.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {report.organization_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })}
                            {report.participants_count && (
                              <span> • {report.participants_count} beneficiários</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge className={status.className}>{status.label}</Badge>
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
