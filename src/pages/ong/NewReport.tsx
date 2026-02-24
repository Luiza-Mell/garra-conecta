import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Calendar,
  Receipt,
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

const NewReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<any[]>([]);
  const [proofFiles, setProofFiles] = useState<any[]>([]);

  // Form data
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

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    if (!organizationId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.from("monthly_reports").insert({
        organization_id: organizationId,
        reference_month: formData.reference_month + "-01",
        status: "draft",
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
      }).select("id").single();

      if (error) throw error;
      if (data) setSavedReportId(data.id);
      toast.success("Rascunho salvo com sucesso!");
      navigate("/ong/relatorios");
    } catch (error) {
      toast.error("Erro ao salvar rascunho");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!organizationId) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("monthly_reports").insert({
        organization_id: organizationId,
        reference_month: formData.reference_month + "-01",
        status: "submitted",
        submitted_at: new Date().toISOString(),
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

      if (error) throw error;
      toast.success("Relatório enviado com sucesso!");
      navigate("/ong/relatorios");
    } catch (error) {
      toast.error("Erro ao enviar relatório");
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

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
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activities_description">Atividades e Projetos Desenvolvidos</Label>
              <Textarea
                id="activities_description"
                placeholder="Descreva as atividades e projetos realizados no período..."
                value={formData.activities_description}
                onChange={(e) => updateFormData("activities_description", e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsible_person">Responsável pela Execução</Label>
                <Input
                  id="responsible_person"
                  placeholder="Nome do responsável"
                  value={formData.responsible_person}
                  onChange={(e) => updateFormData("responsible_person", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form_filled_by">Preenchido por</Label>
                <Input
                  id="form_filled_by"
                  placeholder="Nome de quem preencheu"
                  value={formData.form_filled_by}
                  onChange={(e) => updateFormData("form_filled_by", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project_description">Descrição do Projeto Aprovado</Label>
              <Textarea
                id="project_description"
                placeholder="Descreva brevemente o projeto aprovado..."
                value={formData.project_description}
                onChange={(e) => updateFormData("project_description", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Desafios Enfrentados</Label>
              <Textarea
                id="challenges"
                placeholder="Quais foram os principais desafios no período?"
                value={formData.challenges}
                onChange={(e) => updateFormData("challenges", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advances">Avanços Alcançados</Label>
              <Textarea
                id="advances"
                placeholder="Quais avanços foram conquistados?"
                value={formData.advances}
                onChange={(e) => updateFormData("advances", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_steps">Próximos Passos</Label>
              <Textarea
                id="next_steps"
                placeholder="Quais são os próximos passos planejados?"
                value={formData.next_steps}
                onChange={(e) => updateFormData("next_steps", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="activities_detailed">Descrição Detalhada das Atividades</Label>
              <Textarea
                id="activities_detailed"
                placeholder="Descreva em detalhes as atividades realizadas no período..."
                value={formData.activities_detailed}
                onChange={(e) => updateFormData("activities_detailed", e.target.value)}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants_count">Número de Participantes/Beneficiários</Label>
              <Input
                id="participants_count"
                type="number"
                placeholder="Ex: 150"
                value={formData.participants_count}
                onChange={(e) => updateFormData("participants_count", e.target.value)}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="funds_usage">Utilização do Valor Repassado</Label>
              <Textarea
                id="funds_usage"
                placeholder="Como foram utilizados os recursos repassados pelo Instituto Garra?"
                value={formData.funds_usage}
                onChange={(e) => updateFormData("funds_usage", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash_flow">Fluxo de Caixa</Label>
              <Textarea
                id="cash_flow"
                placeholder="Descreva o fluxo de caixa do período..."
                value={formData.cash_flow}
                onChange={(e) => updateFormData("cash_flow", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial_management_model">Modelo de Gestão Financeira</Label>
              <Textarea
                id="financial_management_model"
                placeholder="Como é feita a gestão financeira do projeto?"
                value={formData.financial_management_model}
                onChange={(e) => updateFormData("financial_management_model", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_resources">Outras Fontes de Recursos</Label>
              <Textarea
                id="other_resources"
                placeholder="O projeto possui outras fontes de financiamento?"
                value={formData.other_resources}
                onChange={(e) => updateFormData("other_resources", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="results_achieved">Resultados Alcançados</Label>
              <Textarea
                id="results_achieved"
                placeholder="Quais resultados foram alcançados no período?"
                value={formData.results_achieved}
                onChange={(e) => updateFormData("results_achieved", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impact_generated">Impacto Gerado nos Beneficiários</Label>
              <Textarea
                id="impact_generated"
                placeholder="Qual o impacto gerado na vida dos beneficiários?"
                value={formData.impact_generated}
                onChange={(e) => updateFormData("impact_generated", e.target.value)}
                rows={4}
              />
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
            <div className="p-6 border-2 border-dashed border-border rounded-xl text-center">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">Evidências de Comunicação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fotos, vídeos, relatos e depoimentos podem ser anexados após salvar o relatório.
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, PDF, MP4 (máx. 10MB cada)
              </p>
            </div>
            <div className="bg-accent/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Você poderá anexar arquivos como notas fiscais, recibos, fotos e vídeos 
                após salvar o relatório como rascunho ou após o envio.
              </p>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="learnings">Aprendizados do Período</Label>
              <Textarea
                id="learnings"
                placeholder="Quais foram os principais aprendizados deste período?"
                value={formData.learnings}
                onChange={(e) => updateFormData("learnings", e.target.value)}
                rows={4}
              />
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
          <h1 className="text-2xl font-bold text-foreground">Novo Relatório Mensal</h1>
          <p className="text-muted-foreground">
            Preencha as informações do relatório de{" "}
            {format(new Date(formData.reference_month + "-01"), "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>

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
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
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
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
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
