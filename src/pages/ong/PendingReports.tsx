import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertCircle, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { format, startOfMonth, addMonths, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingReport {
  id: string;
  reference_month: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MissingMonth {
  month: string; // YYYY-MM-DD
  label: string;
  isOverdue: boolean;
}

const PendingReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [missingMonths, setMissingMonths] = useState<MissingMonth[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!orgData) { setLoading(false); return; }
      setOrgId(orgData.id);

      // Fetch all reports for this org
      const { data: allReports } = await supabase
        .from("monthly_reports")
        .select("id, reference_month, status, created_at, updated_at")
        .eq("organization_id", orgData.id)
        .order("reference_month", { ascending: false });

      const reportsList = allReports || [];

      // Filter actionable reports (draft, submitted, rejected)
      const actionable = reportsList.filter(r => 
        ["draft", "submitted", "rejected"].includes(r.status)
      );
      setReports(actionable);

      // Detect missing months: from registration month to current month
      const registrationDate = parseISO(orgData.created_at);
      const registrationMonth = startOfMonth(registrationDate);
      const currentMonth = startOfMonth(new Date());
      
      const existingMonths = new Set(
        reportsList.map(r => r.reference_month.slice(0, 7))
      );

      const missing: MissingMonth[] = [];
      let checkMonth = registrationMonth;
      
      while (isBefore(checkMonth, currentMonth) || checkMonth.getTime() === currentMonth.getTime()) {
        const monthKey = format(checkMonth, "yyyy-MM");
        if (!existingMonths.has(monthKey)) {
          const isOverdue = isBefore(checkMonth, currentMonth);
          missing.push({
            month: format(checkMonth, "yyyy-MM-dd"),
            label: format(checkMonth, "MMMM yyyy", { locale: ptBR }),
            isOverdue,
          });
        }
        checkMonth = addMonths(checkMonth, 1);
      }

      setMissingMonths(missing);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Create notification for missing months
  useEffect(() => {
    const createNotifications = async () => {
      if (!user || missingMonths.length === 0) return;
      
      for (const m of missingMonths.filter(mm => mm.isOverdue)) {
        const title = "Relatório pendente em atraso";
        const message = `O relatório de ${m.label} ainda não foi enviado. Envie o quanto antes.`;
        
        // Check if notification already exists
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", title)
          .eq("message", message)
          .maybeSingle();

        if (!existing) {
          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message,
            type: "warning",
          });
        }
      }
    };
    createNotifications();
  }, [user, missingMonths]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const totalPending = reports.length + missingMonths.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-warning" />
            Relatórios Pendentes
          </h1>
          <p className="text-muted-foreground">
            Relatórios que precisam de ação — rascunhos, pendentes, rejeitados ou não enviados.
          </p>
        </div>

        {/* Alert for overdue reports */}
        {missingMonths.filter(m => m.isOverdue).length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive">
                    Atenção: {missingMonths.filter(m => m.isOverdue).length} relatório(s) em atraso
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você tem meses sem relatório enviado. Envie-os o quanto antes para manter seu acompanhamento em dia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {totalPending === 0 ? (
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
            {/* Missing months (not yet created) */}
            {missingMonths.map((m) => (
              <Card key={m.month} className={`hover:border-primary/30 transition-colors ${m.isOverdue ? 'border-destructive/30' : ''}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.isOverdue ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                        {m.isOverdue ? (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        ) : (
                          <FileText className="w-5 h-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{m.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {m.isOverdue ? "Relatório não enviado — em atraso" : "Relatório do mês atual — pendente"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={m.isOverdue ? "destructive" : "outline"}>
                        {m.isOverdue ? "Em Atraso" : "Pendente"}
                      </Badge>
                      <Button size="sm" asChild>
                        <Link to={`/ong/novo-relatorio?month=${m.month}`}>
                          Criar Relatório
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Existing draft/submitted/rejected reports */}
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
                      <Badge className={report.status === "draft" ? "status-draft" : report.status === "rejected" ? "status-rejected" : "status-submitted"}>
                        {report.status === "draft" ? "Rascunho" : report.status === "rejected" ? "Rejeitado" : "Enviado"}
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
