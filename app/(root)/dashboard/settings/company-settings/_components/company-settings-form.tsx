"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getCompanySettings, updateCompanySettings } from "../../../invoices/_lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/ui/icons"

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

