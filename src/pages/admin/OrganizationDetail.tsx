import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, User, MapPin, Phone, Mail, Globe, Users, DollarSign,
  Target, FileText, ArrowLeft, Loader2, Calendar, CheckCircle2, Clock, AlertCircle, GraduationCap, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "status-draft" },
  submitted: { label: "Enviado", className: "status-submitted" },
  approved: { label: "Aprovado", className: "status-approved" },
  rejected: { label: "Rejeitado", className: "status-rejected" },
};

const AdminOrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) { setLoading(false); return; }

      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (orgData) setOrg(orgData);

      const { data: reportsData } = await supabase
        .from("monthly_reports")
        .select("*")
        .eq("organization_id", id)
        .order("reference_month", { ascending: false });

      if (reportsData) setReports(reportsData);
      setLoading(false);
    };
    fetchData();
  }, [user, id]);

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!org) {
    return <DashboardLayout><p className="text-muted-foreground">Organização não encontrada.</p></DashboardLayout>;
  }

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
    value ? (
      <div className="flex items-start gap-3 py-2">
        <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground">{value}</p>
        </div>
      </div>
    ) : null
  );

  const reportFields = [
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
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/organizacoes"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
            {org.fantasy_name && <p className="text-muted-foreground text-sm">{org.fantasy_name}</p>}
          </div>
          <Badge className={org.registration_completed ? "status-approved" : "status-submitted"}>
            {org.registration_completed ? "Cadastro Completo" : "Cadastro Pendente"}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Institutional Info */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Dados Institucionais</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <InfoItem icon={Building2} label="Razão Social" value={org.name} />
              <InfoItem icon={Building2} label="Nome Fantasia" value={org.fantasy_name} />
              <InfoItem icon={FileText} label="CNPJ" value={org.cnpj} />
              <InfoItem icon={Building2} label="Natureza" value={org.organization_nature} />
              <InfoItem icon={Calendar} label="Data de Constituição" value={org.constitution_date ? format(new Date(org.constitution_date), "dd/MM/yyyy") : null} />
              <InfoItem icon={Calendar} label="Cadastro na Plataforma" value={format(new Date(org.created_at), "dd/MM/yyyy")} />
            </CardContent>
          </Card>

          {/* Address & Contact */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Endereço e Contato</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <InfoItem icon={MapPin} label="Endereço" value={org.address} />
              <InfoItem icon={MapPin} label="Cidade/Estado" value={org.city && org.state ? `${org.city} - ${org.state}` : org.city || org.state} />
              <InfoItem icon={MapPin} label="CEP" value={org.cep} />
              <InfoItem icon={Mail} label="E-mail Institucional" value={org.institutional_email} />
              <InfoItem icon={Phone} label="Telefone" value={org.phone} />
              <InfoItem icon={Globe} label="Site" value={org.website} />
              <InfoItem icon={Globe} label="Redes Sociais" value={org.social_media} />
            </CardContent>
          </Card>

          {/* Legal Representative */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Representante Legal</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <InfoItem icon={User} label="Nome" value={org.legal_rep_name} />
              <InfoItem icon={Phone} label="Telefone" value={org.legal_rep_phone} />
              <InfoItem icon={Mail} label="E-mail" value={org.legal_rep_email} />
              <InfoItem icon={User} label="Gênero" value={org.legal_rep_gender} />
              <InfoItem icon={User} label="Raça/Cor" value={org.legal_rep_race} />
              <InfoItem icon={GraduationCap} label="Escolaridade" value={org.legal_rep_education} />
            </CardContent>
          </Card>

          {/* Team & Revenue */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Equipe e Receita</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {org.team_structure && org.team_structure.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estrutura da Equipe</p>
                  <div className="flex flex-wrap gap-1.5">
                    {org.team_structure.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <InfoItem icon={DollarSign} label="Receita Anual (2025)" value={org.annual_revenue} />
              {org.areas_of_action && org.areas_of_action.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Áreas de Atuação</p>
                  <div className="flex flex-wrap gap-1.5">
                    {org.areas_of_action.map((a: string) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reports History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Histórico de Relatórios</CardTitle>
            <CardDescription>{reports.length} relatório(s) enviado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum relatório encontrado.</p>
            ) : (
              <div className="space-y-2">
                {reports.map(r => {
                  const sc = statusConfig[r.status] || statusConfig.draft;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(r.reference_month), "MMMM yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.participants_count ? `${r.participants_count} beneficiários` : ""}
                            {r.submitted_at && ` • Enviado em ${format(new Date(r.submitted_at), "dd/MM/yyyy")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={sc.className}>{sc.label}</Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(r)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório Completo</DialogTitle>
            <DialogDescription>
              {org.name} — {selectedReport && format(new Date(selectedReport.reference_month), "MMMM yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {reportFields.map(({ key, label }) => {
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
    </DashboardLayout>
  );
};

export default AdminOrganizationDetail;
