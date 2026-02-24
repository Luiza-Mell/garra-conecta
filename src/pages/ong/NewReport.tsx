import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import {
  Building2,
  FileText,
  Activity,
  DollarSign,
  TrendingUp,
  Users,
  Camera,
  Heart,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Loader2,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const steps = [
  { id: 1, title: "Dados da Organização", icon: Building2 },
  { id: 2, title: "Resumo do Projeto", icon: FileText },
  { id: 3, title: "Execução das Atividades", icon: Activity },
  { id: 4, title: "Execução Financeira", icon: DollarSign },
  { id: 5, title: "Indicadores de Resultado", icon: TrendingUp },
  { id: 6, title: "Ações Conjuntas", icon: Users },
  { id: 7, title: "Evidências", icon: Camera },
  { id: 8, title: "Aprendizados", icon: Heart },
];

// Fields required for final submission
const requiredFields: Record<string, { label: string; step: number }> = {
  reference_month: { label: "Mês de Referência", step: 1 },
  activities_description: { label: "Atividades e Projetos Desenvolvidos", step: 1 },
  responsible_person: { label: "Responsável pela Execução", step: 1 },
  form_filled_by: { label: "Preenchido por", step: 1 },
  project_description: { label: "Descrição do Projeto Aprovado", step: 2 },
  challenges: { label: "Desafios Enfrentados", step: 2 },
  advances: { label: "Avanços Alcançados", step: 2 },
  next_steps: { label: "Próximos Passos", step: 2 },
  activities_detailed: { label: "Descrição Detalhada das Atividades", step: 3 },
  participants_count: { label: "Número de Participantes/Beneficiários", step: 3 },
  funds_usage: { label: "Utilização do Valor Repassado", step: 4 },
  cash_flow: { label: "Fluxo de Caixa", step: 4 },
  financial_management_model: { label: "Modelo de Gestão Financeira", step: 4 },
  other_resources: { label: "Outras Fontes de Recursos", step: 4 },
  results_achieved: { label: "Resultados Alcançados", step: 5 },
  impact_generated: { label: "Impacto Gerado nos Beneficiários", step: 5 },
  autonomy_strategies: { label: "Estratégias para Autonomia Financeira", step: 5 },
  revenue_diversification: { label: "Diversificação de Fontes de Receita", step: 5 },
  network_activities: { label: "Atividades Realizadas em Rede", step: 6 },
  partnerships: { label: "Parcerias Envolvidas", step: 6 },
  partner_locations: { label: "Locais e Organizações Parceiras", step: 6 },
  action_type: { label: "Tipo de Ação Desenvolvida", step: 6 },
  learnings: { label: "Aprendizados do Período", step: 8 },
  personal_report: { label: "Relato Pessoal do(a) Gestor(a)", step: 8 },
  work_life_balance: { label: "Equilíbrio entre Vida Pessoal e Profissional", step: 8 },
  current_needs: { label: "Necessidades Atuais", step: 8 },
  how_garra_can_help: { label: "Como o Instituto Garra Pode Apoiar", step: 8 },
};

const NewReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: reportId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!reportId);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [savedReportId, setSavedReportId] = useState<string | null>(reportId || null);
  const [invoiceFiles, setInvoiceFiles] = useState<any[]>([]);
  const [proofFiles, setProofFiles] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autoSaving, setAutoSaving] = useState(false);

  const [formData, setFormData] = useState({
    reference_month: format(new Date(), "yyyy-MM"),
    activities_description: "",
    responsible_person: "",
    form_filled_by: "",
    project_description: "",
    challenges: "",
    advances: "",
    next_steps: "",
    activities_detailed: "",
    participants_count: "",
    funds_usage: "",
    cash_flow: "",
    financial_management_model: "",
    other_resources: "",
    results_achieved: "",
    impact_generated: "",
    autonomy_strategies: "",
    revenue_diversification: "",
    network_activities: "",
    partnerships: "",
    partner_locations: "",
    action_type: "",
    learnings: "",
    personal_report: "",
    work_life_balance: "",
    current_needs: "",
    how_garra_can_help: "",
  });

  // Fetch organization
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setOrganizationId(data.id);
        setOrganizationName(data.name);
      }
    };
    fetchOrganization();
  }, [user]);

  // Load existing report if editing
  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) return;
      const { data, error } = await supabase
        .from("monthly_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error || !data) {
        toast.error("Relatório não encontrado");
        navigate("/ong/relatorios");
        return;
      }

      const month = data.reference_month ? data.reference_month.substring(0, 7) : format(new Date(), "yyyy-MM");
      setFormData({
        reference_month: month,
        activities_description: data.activities_description || "",
        responsible_person: data.responsible_person || "",
        form_filled_by: data.form_filled_by || "",
        project_description: data.project_description || "",
        challenges: data.challenges || "",
        advances: data.advances || "",
        next_steps: data.next_steps || "",
        activities_detailed: data.activities_detailed || "",
        participants_count: data.participants_count?.toString() || "",
        funds_usage: data.funds_usage || "",
        cash_flow: data.cash_flow || "",
        financial_management_model: data.financial_management_model || "",
        other_resources: data.other_resources || "",
        results_achieved: data.results_achieved || "",
        impact_generated: data.impact_generated || "",
        autonomy_strategies: data.autonomy_strategies || "",
        revenue_diversification: data.revenue_diversification || "",
        network_activities: data.network_activities || "",
        partnerships: data.partnerships || "",
        partner_locations: data.partner_locations || "",
        action_type: data.action_type || "",
        learnings: data.learnings || "",
        personal_report: data.personal_report || "",
        work_life_balance: data.work_life_balance || "",
        current_needs: data.current_needs || "",
        how_garra_can_help: data.how_garra_can_help || "",
      });

      // Load attachments
      const { data: attachments } = await supabase
        .from("report_attachments")
        .select("*")
        .eq("report_id", reportId);

      if (attachments) {
        setInvoiceFiles(attachments.filter((a) => a.category === "notas_fiscais"));
        setProofFiles(attachments.filter((a) => a.category === "provas_de_vida"));
      }

      setInitialLoading(false);
    };
    loadReport();
  }, [reportId, navigate]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors((prev) => prev.filter((f) => f !== field));
  };

  const getFormPayload = () => ({
    organization_id: organizationId!,
    reference_month: formData.reference_month + "-01",
    activities_description: formData.activities_description || null,
    responsible_person: formData.responsible_person || null,
    form_filled_by: formData.form_filled_by || null,
    project_description: formData.project_description || null,
    challenges: formData.challenges || null,
    advances: formData.advances || null,
    next_steps: formData.next_steps || null,
    activities_detailed: formData.activities_detailed || null,
    participants_count: formData.participants_count ? parseInt(formData.participants_count) : null,
    funds_usage: formData.funds_usage || null,
    cash_flow: formData.cash_flow || null,
    financial_management_model: formData.financial_management_model || null,
    other_resources: formData.other_resources || null,
    results_achieved: formData.results_achieved || null,
    impact_generated: formData.impact_generated || null,
    autonomy_strategies: formData.autonomy_strategies || null,
    revenue_diversification: formData.revenue_diversification || null,
    network_activities: formData.network_activities || null,
    partnerships: formData.partnerships || null,
    partner_locations: formData.partner_locations || null,
    action_type: formData.action_type || null,
    learnings: formData.learnings || null,
    personal_report: formData.personal_report || null,
    work_life_balance: formData.work_life_balance || null,
    current_needs: formData.current_needs || null,
    how_garra_can_help: formData.how_garra_can_help || null,
  });

  // Auto-create draft so file uploads work immediately
  const ensureDraftExists = async (): Promise<string | null> => {
    if (savedReportId) return savedReportId;
    if (!organizationId) return null;

    setAutoSaving(true);
    try {
      const { data, error } = await supabase
        .from("monthly_reports")
        .insert({ ...getFormPayload(), status: "draft" })
        .select("id")
        .single();

      if (error) throw error;
      if (data) {
        setSavedReportId(data.id);
        return data.id;
      }
    } catch {
      toast.error("Erro ao criar rascunho para upload");
    } finally {
      setAutoSaving(false);
    }
    return null;
  };

  const handleSaveDraft = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      if (savedReportId) {
        const { error } = await supabase
          .from("monthly_reports")
          .update({ ...getFormPayload(), status: "draft" })
          .eq("id", savedReportId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("monthly_reports")
          .insert({ ...getFormPayload(), status: "draft" })
          .select("id")
          .single();
        if (error) throw error;
        if (data) setSavedReportId(data.id);
      }
      toast.success("Rascunho salvo com sucesso!");
      navigate("/ong/relatorios");
    } catch {
      toast.error("Erro ao salvar rascunho");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const missing = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof typeof formData]?.toString().trim())
      .map(([key]) => key);
    setValidationErrors(missing);
    return missing.length === 0;
  };

  const handleSubmit = async () => {
    if (!organizationId) return;

    if (!validateForm()) {
      const firstMissing = Object.entries(requiredFields).find(
        ([key]) => !formData[key as keyof typeof formData]?.toString().trim()
      );
      if (firstMissing) {
        setCurrentStep(firstMissing[1].step);
      }
      toast.error("Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...getFormPayload(),
        status: "submitted",
        submitted_at: new Date().toISOString(),
      };

      if (savedReportId) {
        const { error } = await supabase
          .from("monthly_reports")
          .update(payload)
          .eq("id", savedReportId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("monthly_reports")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Relatório enviado com sucesso!");
      navigate("/ong/relatorios");
    } catch {
      toast.error("Erro ao enviar relatório");
    } finally {
      setLoading(false);
    }
  };

  const isFieldError = (field: string) => validationErrors.includes(field);

  const progress = (currentStep / steps.length) * 100;

  // Count errors per step
  const stepErrors = (stepId: number) =>
    Object.entries(requiredFields).filter(
      ([key, v]) => v.step === stepId && validationErrors.includes(key)
    ).length;

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Organização</Label>
                <Input value={organizationName} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference_month">Mês de Referência *</Label>
                <Input
                  id="reference_month"
                  type="month"
                  value={formData.reference_month}
                  onChange={(e) => updateFormData("reference_month", e.target.value)}
                  className={isFieldError("reference_month") ? "border-destructive" : ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activities_description">Atividades e Projetos Desenvolvidos *</Label>
              <Textarea
                id="activities_description"
                placeholder="Descreva as atividades e projetos realizados no período..."
                value={formData.activities_description}
                onChange={(e) => updateFormData("activities_description", e.target.value)}
                rows={4}
                className={isFieldError("activities_description") ? "border-destructive" : ""}
              />
              {isFieldError("activities_description") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsible_person">Responsável pela Execução *</Label>
                <Input
                  id="responsible_person"
                  placeholder="Nome do responsável"
                  value={formData.responsible_person}
                  onChange={(e) => updateFormData("responsible_person", e.target.value)}
                  className={isFieldError("responsible_person") ? "border-destructive" : ""}
                />
                {isFieldError("responsible_person") && (
                  <p className="text-xs text-destructive">Campo obrigatório</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="form_filled_by">Preenchido por *</Label>
                <Input
                  id="form_filled_by"
                  placeholder="Nome de quem preencheu"
                  value={formData.form_filled_by}
                  onChange={(e) => updateFormData("form_filled_by", e.target.value)}
                  className={isFieldError("form_filled_by") ? "border-destructive" : ""}
                />
                {isFieldError("form_filled_by") && (
                  <p className="text-xs text-destructive">Campo obrigatório</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project_description">Descrição do Projeto Aprovado *</Label>
              <Textarea
                id="project_description"
                placeholder="Descreva brevemente o projeto aprovado..."
                value={formData.project_description}
                onChange={(e) => updateFormData("project_description", e.target.value)}
                rows={4}
                className={isFieldError("project_description") ? "border-destructive" : ""}
              />
              {isFieldError("project_description") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Desafios Enfrentados *</Label>
              <Textarea
                id="challenges"
                placeholder="Quais foram os principais desafios no período?"
                value={formData.challenges}
                onChange={(e) => updateFormData("challenges", e.target.value)}
                rows={3}
                className={isFieldError("challenges") ? "border-destructive" : ""}
              />
              {isFieldError("challenges") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="advances">Avanços Alcançados *</Label>
              <Textarea
                id="advances"
                placeholder="Quais avanços foram conquistados?"
                value={formData.advances}
                onChange={(e) => updateFormData("advances", e.target.value)}
                rows={3}
                className={isFieldError("advances") ? "border-destructive" : ""}
              />
              {isFieldError("advances") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_steps">Próximos Passos *</Label>
              <Textarea
                id="next_steps"
                placeholder="Quais são os próximos passos planejados?"
                value={formData.next_steps}
                onChange={(e) => updateFormData("next_steps", e.target.value)}
                rows={3}
                className={isFieldError("next_steps") ? "border-destructive" : ""}
              />
              {isFieldError("next_steps") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="activities_detailed">Descrição Detalhada das Atividades *</Label>
              <Textarea
                id="activities_detailed"
                placeholder="Descreva em detalhes as atividades realizadas no período..."
                value={formData.activities_detailed}
                onChange={(e) => updateFormData("activities_detailed", e.target.value)}
                rows={6}
                className={isFieldError("activities_detailed") ? "border-destructive" : ""}
              />
              {isFieldError("activities_detailed") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants_count">Número de Participantes/Beneficiários *</Label>
              <Input
                id="participants_count"
                type="number"
                placeholder="Ex: 150"
                value={formData.participants_count}
                onChange={(e) => updateFormData("participants_count", e.target.value)}
                className={isFieldError("participants_count") ? "border-destructive" : ""}
              />
              {isFieldError("participants_count") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="funds_usage">Utilização do Valor Repassado *</Label>
              <Textarea
                id="funds_usage"
                placeholder="Como foram utilizados os recursos repassados pelo Instituto Garra?"
                value={formData.funds_usage}
                onChange={(e) => updateFormData("funds_usage", e.target.value)}
                rows={4}
                className={isFieldError("funds_usage") ? "border-destructive" : ""}
              />
              {isFieldError("funds_usage") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash_flow">Fluxo de Caixa *</Label>
              <Textarea
                id="cash_flow"
                placeholder="Descreva o fluxo de caixa do período..."
                value={formData.cash_flow}
                onChange={(e) => updateFormData("cash_flow", e.target.value)}
                rows={3}
                className={isFieldError("cash_flow") ? "border-destructive" : ""}
              />
              {isFieldError("cash_flow") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial_management_model">Modelo de Gestão Financeira *</Label>
              <Textarea
                id="financial_management_model"
                placeholder="Como é feita a gestão financeira do projeto?"
                value={formData.financial_management_model}
                onChange={(e) => updateFormData("financial_management_model", e.target.value)}
                rows={3}
                className={isFieldError("financial_management_model") ? "border-destructive" : ""}
              />
              {isFieldError("financial_management_model") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_resources">Outras Fontes de Recursos *</Label>
              <Textarea
                id="other_resources"
                placeholder="O projeto possui outras fontes de financiamento?"
                value={formData.other_resources}
                onChange={(e) => updateFormData("other_resources", e.target.value)}
                rows={3}
                className={isFieldError("other_resources") ? "border-destructive" : ""}
              />
              {isFieldError("other_resources") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
              />
            </div>

            {/* Invoice Upload */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Notas Fiscais</h3>
              </div>
              <FileUpload
                reportId={savedReportId}
                category="notas_fiscais"
                label="Enviar Notas Fiscais"
                description="Imagens ou PDFs das notas fiscais do período"
                accept="image/*,.pdf"
                files={invoiceFiles}
                onFilesChange={setInvoiceFiles}
                onEnsureDraft={ensureDraftExists}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="results_achieved">Resultados Alcançados *</Label>
              <Textarea
                id="results_achieved"
                placeholder="Quais resultados foram alcançados no período?"
                value={formData.results_achieved}
                onChange={(e) => updateFormData("results_achieved", e.target.value)}
                rows={4}
                className={isFieldError("results_achieved") ? "border-destructive" : ""}
              />
              {isFieldError("results_achieved") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="impact_generated">Impacto Gerado nos Beneficiários *</Label>
              <Textarea
                id="impact_generated"
                placeholder="Qual o impacto gerado na vida dos beneficiários?"
                value={formData.impact_generated}
                onChange={(e) => updateFormData("impact_generated", e.target.value)}
                rows={4}
                className={isFieldError("impact_generated") ? "border-destructive" : ""}
              />
              {isFieldError("impact_generated") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="autonomy_strategies">Estratégias para Autonomia Financeira</Label>
              <Textarea
                id="autonomy_strategies"
                placeholder="Quais estratégias estão sendo implementadas para autonomia?"
                value={formData.autonomy_strategies}
                onChange={(e) => updateFormData("autonomy_strategies", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue_diversification">Diversificação de Fontes de Receita</Label>
              <Textarea
                id="revenue_diversification"
                placeholder="Como a organização está diversificando suas fontes de receita?"
                value={formData.revenue_diversification}
                onChange={(e) => updateFormData("revenue_diversification", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="network_activities">Atividades Realizadas em Rede</Label>
              <Textarea
                id="network_activities"
                placeholder="Quais atividades foram realizadas em parceria com outras organizações?"
                value={formData.network_activities}
                onChange={(e) => updateFormData("network_activities", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerships">Parcerias Envolvidas</Label>
              <Textarea
                id="partnerships"
                placeholder="Quais parcerias foram estabelecidas ou fortalecidas?"
                value={formData.partnerships}
                onChange={(e) => updateFormData("partnerships", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_locations">Locais e Organizações Parceiras</Label>
              <Textarea
                id="partner_locations"
                placeholder="Liste os locais e organizações parceiras..."
                value={formData.partner_locations}
                onChange={(e) => updateFormData("partner_locations", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action_type">Tipo de Ação Desenvolvida</Label>
              <Input
                id="action_type"
                placeholder="Ex: Capacitação, Evento, Workshop..."
                value={formData.action_type}
                onChange={(e) => updateFormData("action_type", e.target.value)}
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Provas de Vida</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Envie fotos e vídeos que comprovem a execução das atividades, participação dos beneficiários e impacto do projeto.
              </p>
              <FileUpload
                reportId={savedReportId}
                category="provas_de_vida"
                label="Enviar Fotos e Vídeos"
                description="Imagens e vídeos das atividades realizadas (máx. 20MB cada)"
                accept="image/*,video/*"
                files={proofFiles}
                onFilesChange={setProofFiles}
                onEnsureDraft={ensureDraftExists}
              />
            </div>

            <div className="bg-accent/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Dica:</strong> Envie fotos de atividades com beneficiários, registros de eventos,
                depoimentos em vídeo e qualquer evidência que demonstre o impacto do projeto.
              </p>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="learnings">Aprendizados do Período *</Label>
              <Textarea
                id="learnings"
                placeholder="Quais foram os principais aprendizados deste período?"
                value={formData.learnings}
                onChange={(e) => updateFormData("learnings", e.target.value)}
                rows={4}
                className={isFieldError("learnings") ? "border-destructive" : ""}
              />
              {isFieldError("learnings") && (
                <p className="text-xs text-destructive">Campo obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal_report">Relato Pessoal do(a) Gestor(a)</Label>
              <Textarea
                id="personal_report"
                placeholder="Compartilhe um relato pessoal sobre o período..."
                value={formData.personal_report}
                onChange={(e) => updateFormData("personal_report", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_life_balance">Equilíbrio entre Vida Pessoal e Profissional</Label>
              <Textarea
                id="work_life_balance"
                placeholder="Como está o equilíbrio entre vida pessoal e trabalho?"
                value={formData.work_life_balance}
                onChange={(e) => updateFormData("work_life_balance", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_needs">Necessidades Atuais</Label>
              <Textarea
                id="current_needs"
                placeholder="Quais são as necessidades atuais da organização?"
                value={formData.current_needs}
                onChange={(e) => updateFormData("current_needs", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="how_garra_can_help">Como o Instituto Garra Pode Apoiar</Label>
              <Textarea
                id="how_garra_can_help"
                placeholder="De que forma o Instituto Garra pode ajudar?"
                value={formData.how_garra_can_help}
                onChange={(e) => updateFormData("how_garra_can_help", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {reportId ? "Editar Relatório" : "Novo Relatório Mensal"}
          </h1>
          <p className="text-muted-foreground">
            Preencha as informações do relatório de{" "}
            {format(new Date(formData.reference_month + "-01"), "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Validation Summary */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {validationErrors.length} campo(s) obrigatório(s) não preenchido(s):
              </p>
            </div>
            <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
              {validationErrors.map((key) => (
                <li key={key}>
                  <button
                    className="underline hover:text-destructive"
                    onClick={() => setCurrentStep(requiredFields[key].step)}
                  >
                    {requiredFields[key].label} (Etapa {requiredFields[key].step})
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">
              Etapa {currentStep} de {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const errors = stepErrors(step.id);
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
                {errors > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                    {errors}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-5 h-5 text-primary" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              Preencha as informações solicitadas abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading || autoSaving}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Rascunho
            </Button>

            {currentStep === steps.length ? (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar Relatório
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewReport;
