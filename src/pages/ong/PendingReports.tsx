import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingReport {
  id: string;
  reference_month: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const PendingReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgData) {
        const { data } = await supabase
          .from("monthly_reports")
          .select("id, reference_month, status, created_at, updated_at")
          .eq("organization_id", orgData.id)
          .in("status", ["draft", "submitted", "rejected"])
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-warning" />
            Relatórios Pendentes
          </h1>
          <p className="text-muted-foreground">
            Relatórios que precisam de ação — rascunhos, pendentes ou rejeitados.
          </p>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum relatório pendente!</p>
              <Button asChild>
                <Link to="/ong/dashboard">Voltar ao Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Atualizado em {format(new Date(report.updated_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={report.status === "draft" ? "status-draft" : report.status === "rejected" ? "status-rejected" : "status-pending"}>
                        {report.status === "draft" ? "Rascunho" : report.status === "rejected" ? "Rejeitado" : "Pendente"}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/ong/relatorio/${report.id}`}>
                          Continuar
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingReports;
