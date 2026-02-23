import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  ShieldCheck,
  XCircle,
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
} from "recharts";

interface ReportWithOrg {
  id: string;
  reference_month: string;
  status: string;
  participants_count: number | null;
  organization_name: string;
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
  approved: { label: "Aprovado", className: "status-approved", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", className: "status-rejected", icon: AlertCircle },
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [orgCount, setOrgCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }

      const { count } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });
      setOrgCount(count || 0);

      const { data: reportsData } = await supabase
        .from("monthly_reports")
        .select(`id, reference_month, status, participants_count, submitted_at, organizations (name)`)
        .order("created_at", { ascending: false });

      if (reportsData) setReports(reportsData);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const total = reports.length;
    const approved = reports.filter(r => r.status === "approved").length;
    const submitted = reports.filter(r => r.status === "submitted").length;
    const rejected = reports.filter(r => r.status === "rejected").length;
    const draft = reports.filter(r => r.status === "draft").length;
    const participants = reports.reduce((a, r) => a + (r.participants_count || 0), 0);
    return { total, approved, submitted, rejected, draft, participants };
  }, [reports]);

  const pieData = useMemo(() => [
    { name: "Aprovados", value: stats.approved },
    { name: "Aguardando", value: stats.submitted },
    { name: "Rascunhos", value: stats.draft },
    { name: "Rejeitados", value: stats.rejected },
  ].filter(d => d.value > 0), [stats]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { participants: number; reports: number }>();
    reports.forEach(r => {
      const key = r.reference_month?.slice(0, 7) || "unknown";
      const e = map.get(key) || { participants: 0, reports: 0 };
      e.participants += r.participants_count || 0;
      e.reports += 1;
      map.set(key, e);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([m, v]) => ({
        month: format(new Date(m + "-01"), "MMM yy", { locale: ptBR }),
        participants: v.participants,
        reports: v.reports,
      }));
  }, [reports]);

  const recentSubmitted = useMemo(() =>
    reports
      .filter(r => r.status === "submitted")
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        reference_month: r.reference_month,
        status: r.status,
        organization_name: (r.organizations as { name: string })?.name || "Organização",
        participants_count: r.participants_count,
      })),
    [reports]
  );

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
        {/* Header */}
        <div className="flex items-center justify-between bg-card rounded-lg border border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                Painel Administrativo
              </h1>
              <p className="text-xs text-muted-foreground">
                Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground px-3 py-1.5 text-xs">
            <ShieldCheck className="w-3 h-3 mr-1.5" />
            Administrador
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { icon: Building2, value: orgCount, label: "Organizações", color: "text-primary", bg: "bg-primary/10" },
            { icon: FileText, value: stats.total, label: "Total Relatórios", color: "text-primary", bg: "bg-primary/10" },
            { icon: Clock, value: stats.submitted, label: "Aguardando Revisão", color: "text-warning", bg: "bg-warning/10" },
            { icon: CheckCircle2, value: stats.approved, label: "Aprovados", color: "text-success", bg: "bg-success/10" },
            { icon: XCircle, value: stats.rejected, label: "Rejeitados", color: "text-destructive", bg: "bg-destructive/10" },
            { icon: Users, value: stats.participants.toLocaleString(), label: "Beneficiários", color: "text-primary", bg: "bg-primary/10" },
          ].map((kpi, i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2 border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4 text-primary" />
                Beneficiários por Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Area type="monotone" dataKey="participants" stroke="hsl(45, 100%, 51%)" strokeWidth={2} fillOpacity={1} fill="url(#colorArea)" name="Beneficiários" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar chart */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" />
              Relatórios por Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 12 }} />
                <Bar dataKey="reports" fill="hsl(45, 100%, 51%)" radius={[4, 4, 0, 0]} name="Relatórios" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pending approval table */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentSubmitted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Nenhum relatório pendente de aprovação.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Organização</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mês Ref.</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Beneficiários</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmitted.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium text-foreground">{r.organization_name}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {format(new Date(r.reference_month), "MMM yyyy", { locale: ptBR })}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r.participants_count || "—"}</td>
                        <td className="py-2.5 px-3">
                          <Badge className="status-submitted text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Aguardando
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
