import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoGarra from "@/assets/logo-instituto-garra.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock, CheckCircle, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setIsRecovery(true);
    }

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    setChecking(false);
  }, []);

  const criteria = useMemo(() => [
    { label: "Mínimo de 8 caracteres", met: password.length >= 8 },
    { label: "Máximo de 20 caracteres", met: password.length > 0 && password.length <= 20 },
    { label: "1 letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "1 letra minúscula", met: /[a-z]/.test(password) },
    { label: "1 número", met: /[0-9]/.test(password) },
    { label: "1 caractere especial", met: /[^A-Za-z0-9]/.test(password) },
    { label: "Confirmação de senha igual", met: password.length > 0 && password === confirmPassword },
  ], [password, confirmPassword]);

  const allMet = criteria.every(c => c.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allMet) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Senha atualizada com sucesso!");
    } catch {
      toast.error("Erro ao atualizar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
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
          to="/auth"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>

        <Card className="shadow-soft border-border">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={logoGarra} alt="Instituto Garra" className="h-12" />
            </div>
            <CardTitle className="text-xl">Redefinir Senha</CardTitle>
            <CardDescription>
              {success
                ? "Sua senha foi atualizada com sucesso."
                : "Digite sua nova senha abaixo."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Você já pode fazer login com sua nova senha.
                </p>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Ir para o Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      maxLength={20}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      maxLength={20}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
                  <p className="text-sm font-medium text-foreground mb-2">Critérios da senha:</p>
                  {criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {c.met ? (
                        <Check className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className={c.met ? "text-success" : "text-destructive"}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={!allMet || loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Atualizar Senha
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
