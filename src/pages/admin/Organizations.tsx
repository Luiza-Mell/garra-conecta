import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";

interface OrgWithReports {
  id: string;
  name: string;
  cnpj: string | null;
  created_at: string;
  reportCount: number;
  approvedCount: number;
}

const AdminOrganizations = () => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrgWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }
      const { data: orgData } = await supabase.from("organizations").select("id, name, cnpj, created_at");
      const { data: reportData } = await supabase.from("monthly_reports").select("organization_id, status");

      if (orgData) {
        setOrgs(orgData.map(o => ({
          ...o,
          reportCount: reportData?.filter(r => r.organization_id === o.id).length || 0,
          approvedCount: reportData?.filter(r => r.organization_id === o.id && r.status === "approved").length || 0,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizações</h1>
          <p className="text-muted-foreground">Visualize todas as organizações cadastradas.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar organização..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(org => (
            <Card key={org.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    {org.cnpj && <CardDescription className="text-xs">{org.cnpj}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {org.reportCount} relatórios
                  </span>
                  <Badge className="status-approved text-xs">{org.approvedCount} aprovados</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cadastrada em {format(new Date(org.created_at), "dd/MM/yyyy")}
                </p>
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
    </DashboardLayout>
  );
};

export default AdminOrganizations;
