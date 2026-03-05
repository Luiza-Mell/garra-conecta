import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ReportForReview {
  id: string;
  reference_month: string;
  status: string;
  participants_count: number | null;
  activities_description: string | null;
  results_achieved: string | null;
  challenges: string | null;
  submitted_at: string | null;
  organization_name: string;
  organization_user_id: string;
  [key: string]: any;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: "Aguardando", className: "status-submitted" },
  approved: { label: "Aprovado", className: "status-approved" },
  rejected: { label: "Rejeitado", className: "status-rejected" },
  draft: { label: "Rascunho", className: "status-draft" },
};

const ReviewReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [selectedReport, setSelectedReport] = useState<ReportForReview | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchReports = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("monthly_reports")
      .select(`*, organizations (name, user_id)`)
      .order("submitted_at", { ascending: false });

    if (data) {
      setReports(data.map(r => ({
        ...r,
        organization_name: (r.organizations as any)?.name || "Organização",
        organization_user_id: (r.organizations as any)?.user_id || "",
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [user]);

  const handleApprove = async (report: ReportForReview) => {
    setProcessing(true);
    const { error } = await supabase
      .from("monthly_reports")
      .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", report.id);

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: report.organization_user_id,
        title: "Relatório Aprovado",
        message: `Seu relatório de ${format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })} foi aprovado.`,
        type: "success",
        related_report_id: report.id,
      });
      toast.success("Relatório aprovado com sucesso!");
      fetchReports();
    } else {
      toast.error("Erro ao aprovar relatório.");
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectionReason.trim()) {
      toast.error("Informe o motivo da reprovação.");
      return;
    }
    setProcessing(true);
    const { error } = await supabase
      .from("monthly_reports")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedReport.id);

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: selectedReport.organization_user_id,
        title: "Relatório Reprovado",
        message: `Seu relatório de ${format(new Date(selectedReport.reference_month), "MMMM yyyy", { locale: ptBR })} foi reprovado. Motivo: ${rejectionReason}`,
        type: "rejection",
        related_report_id: selectedReport.id,
      });
      toast.success("Relatório reprovado. A ONG foi notificada.");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedReport(null);
      fetchReports();
    } else {
      toast.error("Erro ao reprovar relatório.");
    }
    setProcessing(false);
  };

  const filtered = reports.filter(r => {
    const nameMatch = r.organization_name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "all" || r.status === statusFilter;
    return nameMatch && statusMatch;
  });

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
          <h1 className="text-2xl font-bold text-foreground">Revisão de Relatórios</h1>
          <p className="text-muted-foreground">Aprove ou reprove os relatórios enviados pelas organizações.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar organização..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "submitted", label: "Aguardando" },
                  { key: "approved", label: "Aprovados" },
                  { key: "rejected", label: "Rejeitados" },
                  { key: "all", label: "Todos" },
                ].map(f => (
                  <Button key={f.key} variant={statusFilter === f.key ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.key)}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
            <CardDescription>{filtered.length} relatório(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum relatório encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(report => {
                  const sc = statusConfig[report.status] || statusConfig.draft;
                  return (
                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{report.organization_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(report.reference_month), "MMMM yyyy", { locale: ptBR })}
                            {report.participants_count && ` • ${report.participants_count} beneficiários`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-16 sm:ml-0">
                        <Badge className={sc.className}>{sc.label}</Badge>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedReport(report); setDetailDialogOpen(true); }}>
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                        {report.status === "submitted" && (
                          <>
                            <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => handleApprove(report)} disabled={processing}>
                              <ThumbsUp className="w-3 h-3 mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedReport(report); setRejectDialogOpen(true); }} disabled={processing}>
                              <ThumbsDown className="w-3 h-3 mr-1" /> Reprovar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Relatório</DialogTitle>
            <DialogDescription>{selectedReport?.organization_name} — {selectedReport && format(new Date(selectedReport.reference_month), "MMMM yyyy", { locale: ptBR })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {[
              { key: "responsible_person", label: "Responsável" },
              { key: "form_filled_by", label: "Preenchido por" },
              { key: "activities_description", label: "Atividades e Projetos" },
              { key: "project_description", label: "Descrição do Projeto" },
              { key: "challenges", label: "Desafios" },
              { key: "advances", label: "Avanços" },
              { key: "next_steps", label: "Próximos Passos" },
              { key: "activities_detailed", label: "Atividades Detalhadas" },
              { key: "participants_count", label: "Beneficiários" },
              { key: "funds_usage", label: "Utilização do Valor" },
              { key: "cash_flow", label: "Fluxo de Caixa" },
              { key: "financial_management_model", label: "Modelo de Gestão Financeira" },
              { key: "other_resources", label: "Outras Fontes de Recursos" },
              { key: "results_achieved", label: "Resultados Alcançados" },
              { key: "impact_generated", label: "Impacto Gerado" },
              { key: "autonomy_strategies", label: "Estratégias de Autonomia" },
              { key: "revenue_diversification", label: "Diversificação de Receita" },
              { key: "network_activities", label: "Atividades em Rede" },
              { key: "partnerships", label: "Parcerias" },
              { key: "partner_locations", label: "Locais Parceiros" },
              { key: "action_type", label: "Tipo de Ação" },
              { key: "learnings", label: "Aprendizados" },
              { key: "personal_report", label: "Relato Pessoal" },
              { key: "work_life_balance", label: "Equilíbrio Vida/Trabalho" },
              { key: "current_needs", label: "Necessidades Atuais" },
              { key: "how_garra_can_help", label: "Como o Garra Pode Ajudar" },
            ].map(({ key, label }) => {
              const value = selectedReport?.[key];
              if (!value && value !== 0) return null;
              return (
                <div key={key}>
                  <p className="font-medium text-foreground mb-0.5">{label}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{value}</p>
                </div>
              );
            })}
            {selectedReport?.rejection_reason && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive mb-0.5">Motivo da Reprovação</p>
                <p className="text-sm text-muted-foreground">{selectedReport.rejection_reason}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar Relatório</DialogTitle>
            <DialogDescription>
              Informe o motivo da reprovação. A organização será notificada e deverá refazer o relatório.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da reprovação..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsDown className="w-4 h-4 mr-2" />}
              Confirmar Reprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReviewReports;
