import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, FileText, Target, TrendingUp, Loader2, Calendar } from "lucide-react";
import { format, startOfYear, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

const Indicators = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgData) {
        const { data } = await supabase
          .from("monthly_reports")
          .select("*")
          .eq("organization_id", orgData.id)
          .order("reference_month", { ascending: false });

        if (data) setReports(data);
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
  const thisYear = reports.filter((r) => isAfter(new Date(r.reference_month), yearStart));
  const currentMonth = new Date().getMonth() + 1;
  const completionRate = currentMonth > 0 ? Math.round((thisYear.length / currentMonth) * 100) : 0;
  const totalParticipants = reports.reduce((a, r) => a + (r.participants_count || 0), 0);
  const avgParticipants = reports.length > 0 ? Math.round(totalParticipants / reports.length) : 0;

  const sections = [
    { label: "Descrição de Atividades", key: "activities_description" },
    { label: "Resultados Alcançados", key: "results_achieved" },
    { label: "Desafios", key: "challenges" },
    { label: "Uso de Recursos", key: "funds_usage" },
    { label: "Fluxo de Caixa", key: "cash_flow" },
    { label: "Parcerias", key: "partnerships" },
    { label: "Próximos Passos", key: "next_steps" },
    { label: "Aprendizados", key: "learnings" },
  ];

  const sectionStats = sections.map((s) => ({
    ...s,
    filled: reports.filter((r) => r[s.key]).length,
    pct: reports.length > 0 ? Math.round((reports.filter((r) => r[s.key]).length / reports.length) * 100) : 0,
  }));

  const monthlyData = thisYear
    .filter((r) => r.participants_count)
    .map((r) => ({
      month: format(new Date(r.reference_month), "MMM", { locale: ptBR }),
      count: r.participants_count || 0,
    }))
    .reverse();

  const maxCount = Math.max(...monthlyData.map((m) => m.count), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Indicadores
          </h1>
          <p className="text-muted-foreground">Métricas e indicadores baseados nos seus relatórios.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Total de Relatórios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{totalParticipants.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Beneficiários Totais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{avgParticipants}</p>
              <p className="text-sm text-muted-foreground">Média por Relatório</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{Math.min(completionRate, 100)}%</p>
              <p className="text-sm text-muted-foreground">Taxa de Envio</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beneficiários por Mês — {new Date().getFullYear()}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado registrado ainda.</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-foreground">{m.count}</span>
                    <div
                      className="w-full bg-primary rounded-t-md transition-all"
                      style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: "4px" }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Fill Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preenchimento das Seções do Relatório</CardTitle>
            <CardDescription>Percentual de relatórios com cada seção preenchida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectionStats.map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium text-foreground">{s.pct}% ({s.filled}/{reports.length})</span>
                  </div>
                  <Progress value={s.pct} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Indicators;
