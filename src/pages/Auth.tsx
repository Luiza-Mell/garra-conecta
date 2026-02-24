import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, HandHeart, ArrowLeft, Loader2, Mail, Lock, User, Building, FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Email inválido").max(255);
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72);

type UserType = "organization" | "admin";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole, signIn, signUp, loading } = useAuth();

  const [userType, setUserType] = useState<UserType>("organization");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === "organization") {
        navigate("/ong/dashboard");
      } else if (userRole === "supporter") {
        navigate("/apoiador/dashboard");
      }
    }
  }, [user, userRole, loading, navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Por favor, confirme seu email antes de fazer login");
          } else {
            toast.error("Erro ao fazer login. Tente novamente.");
          }
        } else {
          toast.success("Login realizado com sucesso!");
        }
      } else {
        const additionalData = userType === "organization" 
          ? { name, organizationName, cnpj }
          : { name, company };

        const { error } = await signUp(email, password, userType, additionalData);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error("Erro ao criar conta. Tente novamente.");
          }
        } else {
          toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
          setMode("login");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        <Card className="shadow-soft border-border">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">G</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Instituto Garra</CardTitle>
            <CardDescription>
              {mode === "login" 
                ? "Entre na sua conta para continuar" 
                : "Crie sua conta para começar"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* User Type Selector */}
            <Tabs value={userType} onValueChange={(v) => setUserType(v as UserType)} className="mb-6">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="organization" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  ONG
                </TabsTrigger>
                <TabsTrigger value="supporter" className="flex items-center gap-2">
                  <HandHeart className="w-4 h-4" />
                  Apoiador
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {userType === "organization" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Nome da Organização</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="organizationName"
                            type="text"
                            placeholder="Nome da ONG"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="cnpj"
                            type="text"
                            placeholder="00.000.000/0000-00"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {userType === "supporter" && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa (opcional)</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Nome da empresa"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    Não tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-primary font-medium hover:underline"
                    >
                      Cadastre-se
                    </button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Faça login
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
