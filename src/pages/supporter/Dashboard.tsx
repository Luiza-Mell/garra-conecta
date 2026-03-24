import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Users, Building2, DollarSign, Target, MapPin, Loader2, TrendingUp,
  BarChart3, Activity, Filter, ChevronDown, FileText, Globe, Phone, Mail,
  Calendar, Hash, Layers,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(45, 100%, 51%)", "hsl(142, 76%, 36%)", "hsl(200, 80%, 50%)",
  "hsl(0, 84%, 60%)", "hsl(280, 60%, 50%)", "hsl(30, 90%, 50%)",
  "hsl(170, 70%, 40%)", "hsl(320, 70%, 50%)", "hsl(60, 70%, 45%)",
];

const BRAZIL_STATES: Record<string, { x: number; y: number }> = {
  AC: { x: 12, y: 52 }, AM: { x: 22, y: 38 }, AP: { x: 42, y: 18 },
  PA: { x: 40, y: 35 }, RO: { x: 18, y: 55 }, RR: { x: 20, y: 15 },
  TO: { x: 45, y: 52 }, MA: { x: 55, y: 35 }, PI: { x: 58, y: 40 },
  CE: { x: 66, y: 35 }, RN: { x: 72, y: 35 }, PB: { x: 72, y: 38 },
  PE: { x: 70, y: 42 }, AL: { x: 72, y: 46 }, SE: { x: 70, y: 49 },
  BA: { x: 62, y: 55 }, MG: { x: 57, y: 68 }, ES: { x: 65, y: 70 },
  RJ: { x: 62, y: 76 }, SP: { x: 52, y: 76 }, PR: { x: 48, y: 82 },
  SC: { x: 50, y: 87 }, RS: { x: 45, y: 92 }, MS: { x: 38, y: 72 },
  MT: { x: 32, y: 55 }, GO: { x: 47, y: 65 }, DF: { x: 50, y: 63 },
};

interface OrgData {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
  areas_of_action: string[] | null;
  annual_revenue: string | null;
  legal_rep_gender: string | null;
  legal_rep_race: string | null;
  legal_rep_name: string | null;
  legal_rep_email: string | null;
  legal_rep_phone: string | null;
  organization_nature: string | null;
  team_structure: string[] | null;
  program_category: string | null;
  project_axis: string | null;
  ods: string[] | null;
  municipalities_count: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  cnpj: string | null;
  created_at: string;
}

const buildPieData = (items: string[]) => {
  const map = new Map<string, number>();
  items.forEach(v => { if (v) map.set(v, (map.get(v) || 0) + 1); });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
};

const MiniPie = ({ data, title, icon: Icon }: { data: { name: string; value: number }[]; title: string; icon: any }) => (
  <Card className="border-border">
    <CardHeader className="pb-2 pt-4 px-4">
      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-2 pb-3">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {data.map((e, i) => (
              <div key={e.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {e.name.length > 25 ? e.name.slice(0, 23) + "…" : e.name} ({e.value})
              </div>
            ))}
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

const SupporterDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Filters
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAxis, setFilterAxis] = useState("all");
  const [filterOds, setFilterOds] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterRevenue, setFilterRevenue] = useState("all");
  const [filterArea, setFilterArea] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, state, city, areas_of_action, annual_revenue, legal_rep_gender, legal_rep_race, organization_nature, team_structure, program_category, project_axis, ods, municipalities_count")
        .eq("registration_completed", true);
      if (orgs) setOrganizations(orgs as any);

      const { data: reps } = await supabase
        .from("monthly_reports")
        .select("id, reference_month, status, participants_count, organization_id, organizations(name)")
        .in("status", ["submitted", "approved"]);
      if (reps) setReports(reps);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter(o => {
      if (filterCategory !== "all" && o.program_category !== filterCategory) return false;
      if (filterAxis !== "all" && o.project_axis !== filterAxis) return false;
      if (filterOds !== "all" && !(o.ods || []).includes(filterOds)) return false;
      if (filterRegion !== "all" && o.state?.toUpperCase() !== filterRegion) return false;
      if (filterRevenue !== "all" && o.annual_revenue !== filterRevenue) return false;
      if (filterArea !== "all" && !(o.areas_of_action || []).includes(filterArea)) return false;
      return true;
    });
  }, [organizations, filterCategory, filterAxis, filterOds, filterRegion, filterRevenue, filterArea]);

  const filteredOrgIds = useMemo(() => new Set(filteredOrgs.map(o => o.id)), [filteredOrgs]);
  const filteredReports = useMemo(() => reports.filter(r => filteredOrgIds.has(r.organization_id)), [reports, filteredOrgIds]);

  const totalParticipants = useMemo(() => filteredReports.reduce((a, r) => a + (r.participants_count || 0), 0), [filteredReports]);

  const areasData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrgs.forEach(o => o.areas_of_action?.forEach(a => map.set(a, (map.get(a) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [filteredOrgs]);

  const genderData = useMemo(() => buildPieData(filteredOrgs.map(o => o.legal_rep_gender).filter(Boolean) as string[]), [filteredOrgs]);
  const raceData = useMemo(() => buildPieData(filteredOrgs.map(o => o.legal_rep_race).filter(Boolean) as string[]), [filteredOrgs]);
  const natureData = useMemo(() => buildPieData(filteredOrgs.map(o => o.organization_nature).filter(Boolean) as string[]), [filteredOrgs]);
  const categoryData = useMemo(() => buildPieData(filteredOrgs.map(o => o.program_category).filter(Boolean) as string[]), [filteredOrgs]);
  const axisData = useMemo(() => buildPieData(filteredOrgs.map(o => o.project_axis).filter(Boolean) as string[]), [filteredOrgs]);

  const odsData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrgs.forEach(o => (o.ods || []).forEach(v => map.set(v, (map.get(v) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.replace(/^ODS \d+ - /, ""), value }));
  }, [filteredOrgs]);

  const stateData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrgs.forEach(o => { if (o.state) map.set(o.state.toUpperCase().trim(), (map.get(o.state.toUpperCase().trim()) || 0) + 1); });
    return map;
  }, [filteredOrgs]);

  // Unique values for filters
  const uniqueCategories = useMemo(() => [...new Set(organizations.map(o => o.program_category).filter(Boolean))], [organizations]);
  const uniqueAxes = useMemo(() => [...new Set(organizations.map(o => o.project_axis).filter(Boolean))], [organizations]);
  const uniqueOds = useMemo(() => {
    const s = new Set<string>();
    organizations.forEach(o => (o.ods || []).forEach(v => s.add(v)));
    return [...s];
  }, [organizations]);
  const uniqueStates = useMemo(() => [...new Set(organizations.map(o => o.state?.toUpperCase()).filter(Boolean))].sort(), [organizations]);
  const uniqueRevenues = useMemo(() => [...new Set(organizations.map(o => o.annual_revenue).filter(Boolean))], [organizations]);
  const uniqueAreas = useMemo(() => {
    const s = new Set<string>();
    organizations.forEach(o => (o.areas_of_action || []).forEach(a => s.add(a)));
    return [...s].sort();
  }, [organizations]);

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
          <div>
            <h1 className="text-lg font-bold text-foreground">Painel do Investidor</h1>
            <p className="text-xs text-muted-foreground">Visão consolidada do impacto social</p>
          </div>
          <Badge className="bg-primary text-primary-foreground px-3 py-1.5 text-xs">
            <TrendingUp className="w-3 h-3 mr-1.5" />
            Apoiador
          </Badge>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <Filter className="w-4 h-4 text-primary" /> Filtros
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {uniqueCategories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterAxis} onValueChange={setFilterAxis}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Eixo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Eixos</SelectItem>
                  {uniqueAxes.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterOds} onValueChange={setFilterOds}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="ODS" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ODS</SelectItem>
                  {uniqueOds.map(o => <SelectItem key={o} value={o}>{o.length > 30 ? o.slice(0, 28) + "…" : o}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Região" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Estados</SelectItem>
                  {uniqueStates.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterRevenue} onValueChange={setFilterRevenue}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Receita" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Faixas</SelectItem>
                  {uniqueRevenues.map(r => <SelectItem key={r} value={r!}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Áreas</SelectItem>
                  {uniqueAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Users, value: totalParticipants.toLocaleString(), label: "Pessoas Impactadas", bg: "bg-primary/10", color: "text-primary" },
            { icon: Building2, value: filteredOrgs.length, label: "ONGs Apoiadas", bg: "bg-success/10", color: "text-success" },
            { icon: Target, value: areasData.length, label: "Áreas de Atuação", bg: "bg-accent", color: "text-primary" },
            { icon: BarChart3, value: filteredReports.length, label: "Relatórios Recebidos", bg: "bg-warning/10", color: "text-warning" },
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

        {/* Gender & Race */}
        <div className="grid lg:grid-cols-2 gap-3">
          <MiniPie data={genderData} title="Gênero dos Representantes" icon={Users} />
          <MiniPie data={raceData} title="Raça/Cor dos Representantes" icon={Users} />
        </div>

        {/* Category & Axis */}
        <div className="grid lg:grid-cols-2 gap-3">
          <MiniPie data={categoryData} title="Categorias do Programa" icon={Target} />
          <MiniPie data={axisData} title="Eixo do Projeto" icon={Activity} />
        </div>

        {/* Areas & ODS */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Areas bar chart */}
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Target className="w-4 h-4 text-primary" /> Áreas de Atuação
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {areasData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={areasData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(0,0%,40%)" }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="value" fill="hsl(45, 100%, 51%)" radius={[0, 4, 4, 0]} name="ONGs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ODS bar chart */}
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Target className="w-4 h-4 text-primary" /> ODS Alinhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {odsData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={odsData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(0,0%,40%)" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(0,0%,40%)" }} width={150} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="value" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} name="ONGs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nature & Revenue */}
        <div className="grid lg:grid-cols-2 gap-3">
          <MiniPie data={natureData} title="Natureza das Organizações" icon={Building2} />
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <DollarSign className="w-4 h-4 text-primary" /> Faixa de Receita
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {(() => {
                const data = buildPieData(filteredOrgs.map(o => o.annual_revenue).filter(Boolean) as string[]);
                return data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(0,0%,88%)", borderRadius: "8px", fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                      {data.map((e, i) => (
                        <div key={e.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {e.name.length > 20 ? e.name.slice(0, 18) + "…" : e.name} ({e.value})
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <MapPin className="w-4 h-4 text-primary" /> Distribuição Geográfica
            </CardTitle>
            <CardDescription className="text-xs">Localização das ONGs apoiadas por estado</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="relative w-full max-w-md mx-auto" style={{ paddingBottom: "100%" }}>
              <svg viewBox="0 0 100 105" className="absolute inset-0 w-full h-full">
                <path
                  d="M20,10 Q35,5 50,12 Q65,18 75,30 Q80,40 78,50 Q75,60 70,70 Q65,78 60,82 Q52,88 48,90 Q42,95 38,92 Q32,88 30,80 Q25,70 20,65 Q15,58 12,50 Q10,40 12,30 Q15,20 20,10 Z"
                  fill="hsl(45, 80%, 95%)"
                  stroke="hsl(45, 10%, 80%)"
                  strokeWidth="0.5"
                />
                {Array.from(stateData.entries()).map(([state, count]) => {
                  const pos = BRAZIL_STATES[state];
                  if (!pos) return null;
                  const radius = Math.min(2 + count * 1.5, 6);
                  return (
                    <g key={state}>
                      <circle cx={pos.x} cy={pos.y} r={radius} fill="hsl(45, 100%, 51%)" opacity={0.8} stroke="hsl(45, 100%, 35%)" strokeWidth="0.5" />
                      <text x={pos.x} y={pos.y + radius + 4} textAnchor="middle" fontSize="3" fill="hsl(0, 0%, 30%)" fontWeight="bold">
                        {state} ({count})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {stateData.size === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum dado geográfico disponível</p>}
          </CardContent>
        </Card>

        {/* Organizations Table */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Building2 className="w-4 h-4 text-primary" /> ONGs Apoiadas ({filteredOrgs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {filteredOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma organização encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Organização</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Áreas</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrgs.map(org => (
                      <tr key={org.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium text-foreground">{org.name}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{org.state || "—"}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{org.program_category || "—"}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {org.areas_of_action?.slice(0, 2).map(a => (
                              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                            {(org.areas_of_action?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">+{(org.areas_of_action?.length || 0) - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{org.annual_revenue || "—"}</td>
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

export default SupporterDashboard;
