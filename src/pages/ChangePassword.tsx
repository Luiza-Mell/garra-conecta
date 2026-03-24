import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

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

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { password_changed: true },
      });

      if (error) throw error;

      toast({ title: "Senha atualizada com sucesso!", description: "Você será redirecionado." });

      // Redirect based on role
      const dest = userRole === "admin" ? "/admin/dashboard"
        : userRole === "supporter" ? "/apoiador/dashboard"
        : "/ong/dashboard";

      setTimeout(() => navigate(dest, { replace: true }), 1000);
    } catch (err: any) {
      toast({ title: "Erro ao atualizar senha", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Criar nova senha</CardTitle>
          <CardDescription>
            Por segurança, você precisa definir uma nova senha antes de acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  maxLength={20}
                  placeholder="Digite sua nova senha"
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
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  maxLength={20}
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
              <p className="text-sm font-medium text-foreground mb-2">Critérios da senha:</p>
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.met ? (
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className={c.met ? "text-green-600" : "text-destructive"}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-sm text-destructive">As senhas não coincidem.</p>
            )}

            <Button type="submit" className="w-full" disabled={!allMet || saving}>
              {saving ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;
