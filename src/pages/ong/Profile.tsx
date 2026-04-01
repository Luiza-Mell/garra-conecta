import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Camera, Check, Eye, EyeOff, Key, Loader2, Save, User, X } from "lucide-react";
import { toast } from "sonner";

const OngProfile = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    avatar_url: "",
  });

  const [orgData, setOrgData] = useState({
    id: "",
    name: "",
    cnpj: "",
    phone: "",
    website: "",
    address: "",
    description: "",
    logo_url: "",
  });


  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          avatar_url: profile.avatar_url || "",
        });
      }

      if (userRole === "organization") {
        const { data: org } = await supabase
          .from("organizations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (org) {
          setOrgData({
            id: org.id,
            name: org.name || "",
            cnpj: org.cnpj || "",
            phone: org.phone || "",
            website: org.website || "",
            address: org.address || "",
            description: org.description || "",
            logo_url: org.logo_url || "",
          });
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user, userRole]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 2MB."); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("report-files")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("report-files").getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      setProfileData((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao fazer upload da foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: profileData.full_name || null, avatar_url: profileData.avatar_url || null })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      if (userRole === "organization" && orgData.id) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update({
            name: orgData.name,
            cnpj: orgData.cnpj || null,
            phone: orgData.phone || null,
            website: orgData.website || null,
            address: orgData.address || null,
            description: orgData.description || null,
            logo_url: orgData.logo_url || null,
          })
          .eq("id", orgData.id);
        if (orgError) throw orgError;
      } else if (userRole === "supporter" && supporterData.id) {
        const { error: supError } = await supabase
          .from("supporters")
          .update({
            name: supporterData.name,
            company: supporterData.company || null,
            phone: supporterData.phone || null,
          })
          .eq("id", supporterData.id);
        if (supError) throw supError;
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const passwordCriteria = useMemo(() => [
    { label: "Mínimo de 8 caracteres", met: newPassword.length >= 8 },
    { label: "Máximo de 20 caracteres", met: newPassword.length > 0 && newPassword.length <= 20 },
    { label: "1 letra maiúscula", met: /[A-Z]/.test(newPassword) },
    { label: "1 letra minúscula", met: /[a-z]/.test(newPassword) },
    { label: "1 número", met: /[0-9]/.test(newPassword) },
    { label: "1 caractere especial", met: /[^A-Za-z0-9]/.test(newPassword) },
    { label: "Confirmação de senha igual", met: newPassword.length > 0 && newPassword === confirmNewPassword },
  ], [newPassword, confirmNewPassword]);

  const allPasswordCriteriaMet = passwordCriteria.every(c => c.met);

  const handleChangePassword = async () => {
    if (!allPasswordCriteriaMet) return;

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPassword(false);
    } catch {
      toast.error("Erro ao alterar a senha.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const displayName = userRole === "organization" ? orgData.name : userRole === "supporter" ? supporterData.name : profileData.full_name;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Perfil</h1>
          <p className="text-muted-foreground">Atualize seus dados pessoais e de acesso.</p>
        </div>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>Clique na foto para alterar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <label className="relative cursor-pointer group">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileData.avatar_url} alt="Foto de perfil" />
                  <AvatarFallback className="text-lg">
                    {(displayName || "U")?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Camera className="w-5 h-5 text-primary" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
              <div>
                <p className="font-medium text-foreground">{displayName || "Usuário"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" placeholder="Seu nome completo" value={profileData.full_name} onChange={(e) => setProfileData((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
            </div>
          </CardContent>
        </Card>

        {/* Organization-specific fields */}
        {userRole === "organization" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Dados da Organização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Organização</Label>
                  <Input value={orgData.name} onChange={(e) => setOrgData((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={orgData.cnpj} onChange={(e) => setOrgData((p) => ({ ...p, cnpj: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={orgData.phone} onChange={(e) => setOrgData((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={orgData.website} onChange={(e) => setOrgData((p) => ({ ...p, website: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={orgData.address} onChange={(e) => setOrgData((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descreva sua organização..." value={orgData.description} onChange={(e) => setOrgData((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supporter-specific fields */}
        {userRole === "supporter" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Dados do Apoiador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={supporterData.name} onChange={(e) => setSupporterData((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input value={supporterData.company} onChange={(e) => setSupporterData((p) => ({ ...p, company: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={supporterData.phone} onChange={(e) => setSupporterData((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Alterar Senha
            </CardTitle>
            <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showPassword ? (
              <Button variant="outline" onClick={() => setShowPassword(true)}>
                Alterar Senha
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <div className="relative">
                    <Input id="new_password" type={showPassword ? "text" : "password"} placeholder="Digite sua nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} maxLength={20} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input id="confirm_password" type={showPassword ? "text" : "password"} placeholder="Confirme sua nova senha" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} maxLength={20} />
                  </div>
                </div>
                <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
                  <p className="text-sm font-medium text-foreground mb-2">Critérios da senha:</p>
                  {passwordCriteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {c.met ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <X className="w-4 h-4 text-destructive shrink-0" />}
                      <span className={c.met ? "text-green-600" : "text-destructive"}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
                  <p className="text-sm text-destructive">As senhas não coincidem.</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={!allPasswordCriteriaMet || changingPassword}>
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                    Confirmar Alteração
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowPassword(false); setNewPassword(""); setConfirmNewPassword(""); }}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OngProfile;
