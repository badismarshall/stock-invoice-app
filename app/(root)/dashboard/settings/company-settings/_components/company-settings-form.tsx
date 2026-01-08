"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getCompanySettings, updateCompanySettings } from "../../../invoices/_lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/ui/icons"
import Image from "next/image"

interface CompanySettingsData {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  nafApe?: string | null;
  rcsRm?: string | null;
  eori?: string | null;
  tvaNumber?: string | null;
}

export function CompanySettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<CompanySettingsData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await getCompanySettings();
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.data) {
          setSettings(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des paramètres");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!settings) {
        toast.error("Aucune donnée à sauvegarder");
        setSaving(false);
        return;
      }

      const result = await updateCompanySettings({
        name: settings.name,
        address: settings.address || null,
        phone: settings.phone || null,
        email: settings.email || null,
        nafApe: settings.nafApe || null,
        rcsRm: settings.rcsRm || null,
        eori: settings.eori || null,
        tvaNumber: settings.tvaNumber || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Paramètres de l'entreprise mis à jour avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la mise à jour des paramètres",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CompanySettingsData, value: string) => {
    setSettings((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Le fichier est trop volumineux (maximum 5MB)");
      return;
    }

    setLogoFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", logoFile);

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de l'upload du logo");
        return;
      }

      toast.success(result.message || "Logo mis à jour avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      // Reset file and preview, but keep showing the new logo
      setLogoFile(null);
      setLogoPreview(null);
      setLogoError(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh the page to show the new logo (add timestamp to force reload)
      window.location.reload();
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'upload du logo",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Paramètres de l'entreprise</h2>
            <p className="text-muted-foreground">
              Gérez les informations de votre entreprise
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8">
        <div className="text-destructive">{error || "Erreur lors du chargement des paramètres"}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paramètres de l'entreprise</h2>
          <p className="text-muted-foreground">
            Gérez les informations de votre entreprise
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <div className="space-y-2">
            <Label>Logo de l'entreprise</Label>
            <div className="flex items-start gap-6">
              {/* Current/Preview Logo */}
              <div className="relative">
                {logoPreview ? (
                  <div className="relative w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-muted/50">
                    <Image
                      src={logoPreview}
                      alt="Aperçu du logo"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                ) : logoError ? (
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                    <div className="text-center text-muted-foreground text-sm">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun logo</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-muted/50">
                    <Image
                      src={`/logo.png?t=${Date.now()}`}
                      alt="Logo de l'entreprise"
                      fill
                      className="object-contain p-2"
                      unoptimized
                      onError={() => {
                        setLogoError(true);
                      }}
                      onLoad={() => {
                        setLogoError(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    disabled={uploadingLogo}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: JPG, PNG, GIF (max 5MB)
                  </p>
                </div>

                {logoFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={uploadingLogo}
                      size="sm"
                    >
                      {uploadingLogo ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Uploader le logo
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveLogoPreview}
                      disabled={uploadingLogo}
                      size="sm"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                  </div>
                )}
                {!logoFile && (
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez une image pour la remplacer
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de l'entreprise <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Sirof Algeria"
              value={settings.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="Adresse complète de l'entreprise"
              value={settings.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                placeholder="+213 XXX XX XX XX"
                value={settings.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.dz"
                value={settings.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nafApe">NAF-APE (Code d'activité)</Label>
              <Input
                id="nafApe"
                placeholder="Ex: 1234Z"
                value={settings.nafApe || ""}
                onChange={(e) => updateField("nafApe", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rcsRm">RCS/RM (Registre du Commerce)</Label>
              <Input
                id="rcsRm"
                placeholder="Ex: RCS Paris 123 456 789"
                value={settings.rcsRm || ""}
                onChange={(e) => updateField("rcsRm", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eori">EORI (Numéro d'opérateur économique)</Label>
              <Input
                id="eori"
                placeholder="Ex: FR12345678901234"
                value={settings.eori || ""}
                onChange={(e) => updateField("eori", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tvaNumber">Numéro TVA intracommunautaire</Label>
              <Input
                id="tvaNumber"
                placeholder="Ex: FR12345678901"
                value={settings.tvaNumber || ""}
                onChange={(e) => updateField("tvaNumber", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}

