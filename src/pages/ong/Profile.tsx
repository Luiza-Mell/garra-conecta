import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Camera, Key, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

const OngProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

      const [{ data: profile }, { data: org }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("organizations").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          avatar_url: profile.avatar_url || "",
        });
      }

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

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("report-files")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("report-files")
        .getPublicUrl(filePath);

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
        .update({
          full_name: profileData.full_name || null,
          avatar_url: profileData.avatar_url || null,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      if (orgData.id) {
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
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Perfil</h1>
          <p className="text-muted-foreground">Atualize os dados da sua organização.</p>
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
                    {orgData.name?.[0]?.toUpperCase() || "O"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Camera className="w-5 h-5 text-primary" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
              <div>
                <p className="font-medium text-foreground">{orgData.name || "Organização"}</p>
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
              <Input
                id="full_name"
                placeholder="Seu nome completo"
                value={profileData.full_name}
                onChange={(e) => setProfileData((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Organização */}
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
                <Label htmlFor="org_name">Nome da Organização</Label>
                <Input
                  id="org_name"
                  value={orgData.name}
                  onChange={(e) => setOrgData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={orgData.cnpj}
                  onChange={(e) => setOrgData((p) => ({ ...p, cnpj: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={orgData.phone}
                  onChange={(e) => setOrgData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={orgData.website}
                  onChange={(e) => setOrgData((p) => ({ ...p, website: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={orgData.address}
                onChange={(e) => setOrgData((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva sua organização..."
                value={orgData.description}
                onChange={(e) => setOrgData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default OngProfile;
