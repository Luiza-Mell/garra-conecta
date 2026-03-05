import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Building2,
  User,
  Users,
  DollarSign,
  Target,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  MapPin,
  Phone,
  GraduationCap,
} from "lucide-react";

const steps = [
  { id: 1, title: "Informações Institucionais", icon: Building2 },
  { id: 2, title: "Endereço e Contato", icon: MapPin },
  { id: 3, title: "Representante Legal", icon: User },
  { id: 4, title: "Equipe e Receita", icon: DollarSign },
  { id: 5, title: "Áreas de Atuação", icon: Target },
];

const ORGANIZATION_NATURES = [
  "Organização da Sociedade Civil (formalizada)",
  "Coletivo ou projeto social (não formalizado juridicamente)",
  "Movimento social",
  "Outros",
];

const GENDERS = ["Feminino", "Masculino", "Não binário", "Outros", "Prefiro não declarar"];

const RACES = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Prefiro não declarar"];

const EDUCATION_LEVELS = [
  "Ensino médio incompleto", "Ensino médio completo",
  "Superior incompleto", "Superior completo",
  "Pós-graduação incompleta", "Pós-graduação completa",
  "MBA incompleto", "MBA completo",
  "Mestrado incompleto", "Mestrado completo",
  "Doutorado incompleto", "Doutorado completo",
  "Outros",
];

const TEAM_OPTIONS = [
  "Colaboradores CLT",
  "Colaboradores PJ / MEI / autônomos",
  "Voluntários",
  "Outros",
];

const REVENUE_OPTIONS = [
  "Zero", "Até R$ 50.000", "R$ 51.000 a R$ 100.000",
  "R$ 101.000 a R$ 300.000", "R$ 301.000 a R$ 500.000",
  "R$ 501.000 a R$ 1.000.000", "R$ 1.001.000 a R$ 2.000.000",
  "R$ 2.000.000 a R$ 5.000.000", "Acima de R$ 5.000.000",
];

const AREAS_OF_ACTION = [
  "Alimentação", "Assistência Social", "Cidadania e Defesa dos Direitos Humanos",
  "Ciência e Tecnologia", "Cultura e Artes", "Direito das Mulheres",
  "Educação", "Esportes", "Infraestrutura e Saneamento",
  "Meio Ambiente", "Primeira Infância", "Proteção Animal",
  "Saúde", "Violência", "Empreendedorismo", "Outros",
];

const OngRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", // Razão Social
    fantasy_name: "",
    organization_nature: "",
    cnpj: "",
    constitution_date: "",
    address: "",
    state: "",
    city: "",
    cep: "",
    institutional_email: "",
    phone: "",
    website: "",
    social_media: "",
    legal_rep_name: "",
    legal_rep_phone: "",
    legal_rep_email: "",
    legal_rep_gender: "",
    legal_rep_race: "",
    legal_rep_education: "",
    team_structure: [] as string[],
    annual_revenue: "",
    areas_of_action: [] as string[],
  });

  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("organizations")
        .select("id, name, cnpj")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setOrgId(data.id);
        setForm(prev => ({
          ...prev,
          name: data.name || "",
          cnpj: data.cnpj || "",
        }));
      }
    };
    fetchOrg();
  }, [user]);

  const update = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: "team_structure" | "areas_of_action", value: string, maxItems?: number) => {
    setForm(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      }
      if (maxItems && arr.length >= maxItems) {
        toast.error(`Selecione no máximo ${maxItems} opções.`);
        return prev;
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!form.name.trim()) { toast.error("Razão Social é obrigatória."); return false; }
        if (!form.organization_nature) { toast.error("Selecione a natureza da organização."); return false; }
        return true;
      case 2:
        if (!form.address.trim()) { toast.error("Endereço é obrigatório."); return false; }
        if (!form.state.trim()) { toast.error("Estado é obrigatório."); return false; }
        if (!form.city.trim()) { toast.error("Cidade é obrigatória."); return false; }
        if (!form.cep.trim()) { toast.error("CEP é obrigatório."); return false; }
        if (!form.institutional_email.trim()) { toast.error("E-mail institucional é obrigatório."); return false; }
        if (!form.phone.trim()) { toast.error("Telefone é obrigatório."); return false; }
        return true;
      case 3:
        if (!form.legal_rep_name.trim()) { toast.error("Nome do representante é obrigatório."); return false; }
        if (!form.legal_rep_phone.trim()) { toast.error("Telefone do representante é obrigatório."); return false; }
        if (!form.legal_rep_email.trim()) { toast.error("E-mail do representante é obrigatório."); return false; }
        if (!form.legal_rep_gender) { toast.error("Selecione o gênero."); return false; }
        if (!form.legal_rep_race) { toast.error("Selecione raça/cor."); return false; }
        if (!form.legal_rep_education) { toast.error("Selecione a escolaridade."); return false; }
        return true;
      case 4:
        if (form.team_structure.length === 0) { toast.error("Selecione a estrutura da equipe."); return false; }
        if (!form.annual_revenue) { toast.error("Selecione a faixa de receita."); return false; }
        return true;
      case 5:
        if (form.areas_of_action.length === 0) { toast.error("Selecione ao menos uma área de atuação."); return false; }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleSubmit = async () => {
    if (!validateStep() || !orgId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: form.name,
          fantasy_name: form.fantasy_name || null,
          organization_nature: form.organization_nature,
          cnpj: form.cnpj || null,
          constitution_date: form.constitution_date || null,
          address: form.address,
          state: form.state,
          city: form.city,
          cep: form.cep,
          institutional_email: form.institutional_email,
          phone: form.phone,
          website: form.website || null,
          social_media: form.social_media || null,
          legal_rep_name: form.legal_rep_name,
          legal_rep_phone: form.legal_rep_phone,
          legal_rep_email: form.legal_rep_email,
          legal_rep_gender: form.legal_rep_gender,
          legal_rep_race: form.legal_rep_race,
          legal_rep_education: form.legal_rep_education,
          team_structure: form.team_structure,
          annual_revenue: form.annual_revenue,
          areas_of_action: form.areas_of_action,
          registration_completed: true,
        } as any)
        .eq("id", orgId);

      if (error) throw error;
      toast.success("Cadastro realizado com sucesso!");
      navigate("/ong/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar cadastro.");
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
            <div className="space-y-2">
              <Label htmlFor="name">Razão Social *</Label>
              <Input id="name" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Razão social da organização" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fantasy_name">Nome Fantasia</Label>
              <Input id="fantasy_name" value={form.fantasy_name} onChange={e => update("fantasy_name", e.target.value)} placeholder="Nome fantasia (opcional)" />
            </div>
            <div className="space-y-3">
              <Label>Natureza da Organização *</Label>
              <RadioGroup value={form.organization_nature} onValueChange={v => update("organization_nature", v)}>
                {ORGANIZATION_NATURES.map(n => (
                  <div key={n} className="flex items-center space-x-2">
                    <RadioGroupItem value={n} id={`nature-${n}`} />
                    <Label htmlFor={`nature-${n}`} className="font-normal cursor-pointer">{n}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={form.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="constitution_date">Data de Constituição Legal</Label>
                <Input id="constitution_date" type="date" value={form.constitution_date} onChange={e => update("constitution_date", e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo *</Label>
              <Input id="address" value={form.address} onChange={e => update("address", e.target.value)} placeholder="Rua, número, bairro..." />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input id="state" value={form.state} onChange={e => update("state", e.target.value)} placeholder="Ex: SP" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" value={form.city} onChange={e => update("city", e.target.value)} placeholder="Ex: São Paulo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input id="cep" value={form.cep} onChange={e => update("cep", e.target.value)} placeholder="00000-000" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="institutional_email">E-mail Institucional *</Label>
                <Input id="institutional_email" type="email" value={form.institutional_email} onChange={e => update("institutional_email", e.target.value)} placeholder="contato@org.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone com DDD *</Label>
                <Input id="phone" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Site</Label>
                <Input id="website" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_media">Redes Sociais</Label>
                <Input id="social_media" value={form.social_media} onChange={e => update("social_media", e.target.value)} placeholder="@instagram, facebook..." />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legal_rep_name">Nome do Representante Legal *</Label>
                <Input id="legal_rep_name" value={form.legal_rep_name} onChange={e => update("legal_rep_name", e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_rep_phone">Telefone do Representante *</Label>
                <Input id="legal_rep_phone" value={form.legal_rep_phone} onChange={e => update("legal_rep_phone", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_rep_email">E-mail do Representante *</Label>
              <Input id="legal_rep_email" type="email" value={form.legal_rep_email} onChange={e => update("legal_rep_email", e.target.value)} placeholder="representante@email.com" />
            </div>
            <div className="space-y-3">
              <Label>Gênero *</Label>
              <RadioGroup value={form.legal_rep_gender} onValueChange={v => update("legal_rep_gender", v)}>
                {GENDERS.map(g => (
                  <div key={g} className="flex items-center space-x-2">
                    <RadioGroupItem value={g} id={`gender-${g}`} />
                    <Label htmlFor={`gender-${g}`} className="font-normal cursor-pointer">{g}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label>Raça/Cor *</Label>
              <RadioGroup value={form.legal_rep_race} onValueChange={v => update("legal_rep_race", v)}>
                {RACES.map(r => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={`race-${r}`} />
                    <Label htmlFor={`race-${r}`} className="font-normal cursor-pointer">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label>Escolaridade *</Label>
              <RadioGroup value={form.legal_rep_education} onValueChange={v => update("legal_rep_education", v)}>
                <div className="grid md:grid-cols-2 gap-2">
                  {EDUCATION_LEVELS.map(e => (
                    <div key={e} className="flex items-center space-x-2">
                      <RadioGroupItem value={e} id={`edu-${e}`} />
                      <Label htmlFor={`edu-${e}`} className="font-normal cursor-pointer text-sm">{e}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Estrutura da Equipe * (pode selecionar mais de uma)</Label>
              {TEAM_OPTIONS.map(t => (
                <div key={t} className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-${t}`}
                    checked={form.team_structure.includes(t)}
                    onCheckedChange={() => toggleArray("team_structure", t)}
                  />
                  <Label htmlFor={`team-${t}`} className="font-normal cursor-pointer">{t}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Label>Receita da Organização em 2025 *</Label>
              <RadioGroup value={form.annual_revenue} onValueChange={v => update("annual_revenue", v)}>
                {REVENUE_OPTIONS.map(r => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={`rev-${r}`} />
                    <Label htmlFor={`rev-${r}`} className="font-normal cursor-pointer">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Áreas de Atuação * (selecione até 3)</Label>
              <div className="grid md:grid-cols-2 gap-2">
                {AREAS_OF_ACTION.map(a => (
                  <div key={a} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${a}`}
                      checked={form.areas_of_action.includes(a)}
                      onCheckedChange={() => toggleArray("areas_of_action", a, 3)}
                    />
                    <Label htmlFor={`area-${a}`} className="font-normal cursor-pointer text-sm">{a}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Welcome message */}
        {currentStep === 1 && (
          <Card className="border-primary/20 bg-accent/30">
            <CardContent className="pt-6">
              <h2 className="text-lg font-bold text-foreground mb-2">Cadastro Organizações - Apoiadas</h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Olá, seja muito bem-vindo!</p>
                <p>Se você está aqui é porque sua organização foi selecionada para ser acompanhada por um período médio de 08 meses pelo Instituto Garra Social.</p>
                <p>Mensalmente sua organização se comprometerá a enviar dados de prestação de contas e relatórios solicitados nesta plataforma.</p>
                <p>Neste primeiro momento precisamos cadastrar os dados institucionais da organização e do seu representante legal.</p>
                <p>A maioria das informações já foi preenchida no formulário de inscrição para participação, porém é necessário preencher novamente com atenção para que todos os dados fiquem registrados oficialmente em nossa plataforma.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Etapa {currentStep} de {steps.length}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {steps.map(step => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" :
                  isDone ? "bg-success/10 text-success cursor-pointer" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="w-3.5 h-3.5" />
                {step.title}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const Icon = steps[currentStep - 1].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>Preencha todos os campos obrigatórios marcados com *</CardDescription>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar Cadastro
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OngRegistration;
