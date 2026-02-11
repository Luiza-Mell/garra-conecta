import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  TrendingUp,
  Heart,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line,
} from "recharts";

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
  pendingReports: number;
  rejectedReports: number;
  recentReports: ReportWithOrg[];
  organizationNames: string[];
  monthlyData: { month: string; participants: number; reports: number }[];
  orgParticipants: { name: string; participants: number }[];
}

const CHART_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(45, 100%, 51%)",
  "hsl(0, 0%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 80%, 50%)",
];

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
    pendingReports: 0,
    rejectedReports: 0,
    recentReports: [],
    organizationNames: [],
    monthlyData: [],
    orgParticipants: [],
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
        const approvedCount = reportsData.filter((r) => r.status === "approved").length;
        const submittedCount = reportsData.filter((r) => r.status === "submitted").length;
        const draftCount = reportsData.filter((r) => r.status === "draft").length;
        const pendingCount = reportsData.filter((r) => r.status === "pending").length;
        const rejectedCount = reportsData.filter((r) => r.status === "rejected").length;

        // Build monthly data
        const monthMap = new Map<string, { participants: number; reports: number }>();
        reportsData.forEach((r) => {
          const key = r.reference_month?.slice(0, 7) || "unknown";
          const existing = monthMap.get(key) || { participants: 0, reports: 0 };
          existing.participants += r.participants_count || 0;
          existing.reports += 1;
          monthMap.set(key, existing);
        });
        const monthlyData = Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, vals]) => ({
            month: format(new Date(month + "-01"), "MMM yy", { locale: ptBR }),
            participants: vals.participants,
            reports: vals.reports,
          }));

        // Build org participants
        const orgMap = new Map<string, number>();
        reportsData.forEach((r) => {
          const name = (r.organizations as { name: string })?.name || "Outros";
          orgMap.set(name, (orgMap.get(name) || 0) + (r.participants_count || 0));
        });
        const orgParticipants = Array.from(orgMap.entries())
          .map(([name, participants]) => ({ name, participants }))
          .sort((a, b) => b.participants - a.participants)
          .slice(0, 8);

        const recentReports = reportsData.slice(0, 8).map((r) => ({
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
          submittedReports: submittedCount,
          pendingReports: pendingCount,
          rejectedReports: rejectedCount,
          recentReports,
          organizationNames: orgsData?.map((o) => o.name) || [],
          monthlyData,
          orgParticipants,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const pieData = useMemo(() => [
    { name: "Aprovados", value: data.approvedReports },
    { name: "Enviados", value: data.submittedReports },
    { name: "Rascunhos", value: data.draftReports },
    { name: "Rejeitados", value: data.rejectedReports },
    { name: "Pendentes", value: data.pendingReports },
  ].filter((d) => d.value > 0), [data]);

  const completionRate = data.totalReports > 0
    ? Math.round(((data.approvedReports + data.submittedReports) / data.totalReports) * 100)
    : 0;

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
      <div className="space-y-4 bg-muted/30 -m-6 p-6 min-h-screen">
        {/* Power BI Header Bar */}
        <div className="flex items-center justify-between bg-card rounded-lg border border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                Painel do Apoiador — {supporterName || "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground px-3 py-1.5 text-xs">
            <Heart className="w-3 h-3 mr-1.5" />
            Apoiador Garra
          </Badge>
        </div>

        {/* KPI Row - Power BI style cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard
            icon={Building2}
            value={data.totalOrganizations}
            label="Organizações"
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <KPICard
            icon={Users}
            value={data.totalParticipants.toLocaleString()}
            label="Beneficiários"
            color="text-success"
            bgColor="bg-success/10"
          />
          <KPICard
            icon={FileText}
            value={data.totalReports}
            label="Relatórios"
            color="text-warning"
            bgColor="bg-warning/10"
          />
          <KPICard
            icon={Award}
            value={data.approvedReports}
            label="Aprovados"
            color="text-success"
            bgColor="bg-success/10"
          />
          <KPICard
            icon={Target}
            value={`${completionRate}%`}
            label="Taxa de Conclusão"
            color="text-primary"
            bgColor="bg-primary/10"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Beneficiários por mês - Area Chart */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4 text-primary" />
                Beneficiários por Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.monthlyData}>
                  <defs>
                    <linearGradient id="colorPart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0,0%,100%)",
                      border: "1px solid hsl(0,0%,88%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="participants"
                    stroke="hsl(45, 100%, 51%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPart)"
                    name="Beneficiários"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <PieChartIcon className="w-4 h-4 text-primary" />
                Status dos Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0,0%,100%)",
                      border: "1px solid hsl(0,0%,88%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Relatórios por mês - Bar Chart */}
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BarChart3 className="w-4 h-4 text-primary" />
                Relatórios por Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0,0%,100%)",
                      border: "1px solid hsl(0,0%,88%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="reports"
                    fill="hsl(45, 100%, 51%)"
                    radius={[4, 4, 0, 0]}
                    name="Relatórios"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Beneficiários por Organização - Horizontal Bar */}
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Beneficiários por Organização
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.orgParticipants} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: "hsl(0,0%,40%)" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0,0%,100%)",
                      border: "1px solid hsl(0,0%,88%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="participants"
                    fill="hsl(142, 76%, 36%)"
                    radius={[0, 4, 4, 0]}
                    name="Beneficiários"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Table: Recent Reports */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Relatórios Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.recentReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Nenhum relatório disponível.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">Organização</th>
                      <th className="text-left py-2 px-2 font-medium">Mês Ref.</th>
                      <th className="text-center py-2 px-2 font-medium">Beneficiários</th>
                      <th className="text-center py-2 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentReports.map((report) => {
                      const status = statusConfig[report.status] || statusConfig.draft;
                      const StatusIcon = status.icon;
                      return (
                        <tr
                          key={report.id}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-2.5 px-2 font-medium text-foreground">
                            {report.organization_name}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground capitalize">
                            {format(new Date(report.reference_month), "MMM yyyy", { locale: ptBR })}
                          </td>
                          <td className="py-2.5 px-2 text-center text-foreground font-medium">
                            {report.participants_count?.toLocaleString() || "—"}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <Badge className={`${status.className} text-xs`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organizations chips */}
        {data.organizationNames.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Organizações Apoiadas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {data.organizationNames.map((name, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1.5 text-xs">
                    <Building2 className="w-3 h-3 mr-1.5" />
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

// KPI Card component
const KPICard = ({
  icon: Icon,
  value,
  label,
  color,
  bgColor,
}: {
  icon: typeof Building2;
  value: string | number;
  label: string;
  color: string;
  bgColor: string;
}) => (
  <Card className="border-border">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ApoiadorDashboard;
