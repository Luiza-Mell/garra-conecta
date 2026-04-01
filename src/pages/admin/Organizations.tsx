import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Search, Loader2, FileText, Eye, Filter, X, Plus, Copy, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";

interface OrgWithReports {
  id: string;
  name: string;
  cnpj: string | null;
  state: string | null;
  city: string | null;
  organization_nature: string | null;
  areas_of_action: string[] | null;
  annual_revenue: string | null;
  registration_completed: boolean;
  created_at: string;
  reportCount: number;
  approvedCount: number;
  pendingCount: number;
}

const AdminOrganizations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<OrgWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [natureFilter, setNatureFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");

  // Create ONG dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id, name, cnpj, state, city, organization_nature, areas_of_action, annual_revenue, registration_completed, created_at");
    const { data: reportData } = await supabase
      .from("monthly_reports")
      .select("organization_id, status");

    if (orgData) {
      setOrgs(orgData.map((o: any) => ({
        ...o,
        reportCount: reportData?.filter(r => r.organization_id === o.id).length || 0,
        approvedCount: reportData?.filter(r => r.organization_id === o.id && r.status === "approved").length || 0,
        pendingCount: reportData?.filter(r => r.organization_id === o.id && r.status === "submitted").length || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateOrg = async () => {
    if (!newEmail || !newOrgName) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-manage-users", {
      body: { action: "create_org", email: newEmail, orgName: newOrgName },
    });
    setCreating(false);

    if (error || data?.error) {
      toast.error(data?.error || "Erro ao cadastrar ONG.");
      return;
    }

    setCreatedPassword(data.password);
    toast.success("ONG cadastrada com sucesso!");
    fetchData();
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setNewEmail("");
    setNewOrgName("");
    setCreatedPassword(null);
    setCopied(false);
  };

  const handleCopy = () => {
    const text = `E-mail: ${newEmail}\nSenha provisória: ${createdPassword}\n\nAcesse a plataforma e crie uma nova senha no primeiro acesso.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Dados copiados!");
    setTimeout(() => setCopied(false), 2000);
  };

  const uniqueStates = [...new Set(orgs.map(o => o.state).filter(Boolean))] as string[];
  const uniqueCities = [...new Set(orgs.map(o => o.city).filter(Boolean))] as string[];
  const uniqueNatures = [...new Set(orgs.map(o => o.organization_nature).filter(Boolean))] as string[];
  const uniqueRevenues = [...new Set(orgs.map(o => o.annual_revenue).filter(Boolean))] as string[];
  const uniqueAreas = [...new Set(orgs.flatMap(o => o.areas_of_action || []))];

  const hasFilters = stateFilter !== "all" || cityFilter !== "all" || natureFilter !== "all" || areaFilter !== "all" || revenueFilter !== "all" || reportStatusFilter !== "all";

  const clearFilters = () => {
    setStateFilter("all"); setCityFilter("all"); setNatureFilter("all");
    setAreaFilter("all"); setRevenueFilter("all"); setReportStatusFilter("all");
  };

  const filtered = orgs.filter(o => {
    if (!o.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (stateFilter !== "all" && o.state !== stateFilter) return false;
    if (cityFilter !== "all" && o.city !== cityFilter) return false;
    if (natureFilter !== "all" && o.organization_nature !== natureFilter) return false;
    if (revenueFilter !== "all" && o.annual_revenue !== revenueFilter) return false;
    if (areaFilter !== "all" && !(o.areas_of_action || []).includes(areaFilter)) return false;
    if (reportStatusFilter === "pending" && o.pendingCount === 0) return false;
    if (reportStatusFilter === "no_reports" && o.reportCount > 0) return false;
    if (reportStatusFilter === "up_to_date" && o.pendingCount > 0) return false;
    return true;
  });

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organizações</h1>
            <p className="text-muted-foreground">Visualize e gerencie todas as organizações cadastradas.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Cadastrar ONG
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar organização..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros</span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                  <X className="w-3 h-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {uniqueStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Cidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Cidades</SelectItem>
                  {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={natureFilter} onValueChange={setNatureFilter}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Natureza" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Naturezas</SelectItem>
                  {uniqueNatures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Áreas</SelectItem>
                  {uniqueAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Receita" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Faixas</SelectItem>
                  {uniqueRevenues.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Relatórios" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Com Pendentes</SelectItem>
                  <SelectItem value="no_reports">Sem Relatórios</SelectItem>
                  <SelectItem value="up_to_date">Em Dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">{filtered.length} organização(ões) encontrada(s)</p>

        {/* Organizations Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(org => (
            <Card key={org.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{org.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {org.city && org.state ? `${org.city} - ${org.state}` : org.cnpj || "Sem localização"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {org.reportCount} relatórios
                  </span>
                  <Badge className="status-approved text-xs">{org.approvedCount} aprovados</Badge>
                </div>
                {org.pendingCount > 0 && (
                  <Badge className="status-submitted text-xs">{org.pendingCount} pendente(s)</Badge>
                )}
                {org.areas_of_action && org.areas_of_action.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {org.areas_of_action.slice(0, 2).map(a => (
                      <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">{a}</Badge>
                    ))}
                    {org.areas_of_action.length > 2 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{org.areas_of_action.length - 2}</Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Cadastrada em {format(new Date(org.created_at), "dd/MM/yyyy")}
                  </p>
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                    <Link to={`/admin/organizacao/${org.id}`}>
                      <Eye className="w-3 h-3 mr-1" /> Ver
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma organização encontrada.</p>
          </div>
        )}
      </div>

      {/* Create ONG Dialog */}
      <Dialog open={showCreate} onOpenChange={open => { if (!open) handleCloseCreate(); else setShowCreate(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova ONG</DialogTitle>
            <DialogDescription>
              {createdPassword
                ? "ONG cadastrada! Copie e envie os dados de acesso."
                : "Insira o e-mail e nome da organização. Uma senha provisória será gerada automaticamente."}
            </DialogDescription>
          </DialogHeader>

          {createdPassword ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2">
                <div className="flex items-center gap-2 text-success font-medium text-sm">
                  <CheckCircle2 className="w-4 h-4" /> ONG cadastrada com sucesso!
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>E-mail:</strong> {newEmail}</p>
                  <p><strong>Senha provisória:</strong> {createdPassword}</p>
                </div>
                <p className="text-xs text-muted-foreground">A ONG deverá criar uma nova senha no primeiro acesso.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>Fechar</Button>
                <Button onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar Dados"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Nome da Organização</Label>
                <Input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Ex: Instituto Exemplo" />
              </div>
              <div>
                <Label>E-mail da ONG</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@organizacao.com" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>Cancelar</Button>
                <Button onClick={handleCreateOrg} disabled={creating || !newEmail || !newOrgName}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminOrganizations;
