"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Icons } from "@/components/ui/icons"

interface DeliveryNoteItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export function NewDeliveryNoteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string;
    salePriceExport: number | null;
    unitOfMeasure: string;
  }>>([]);

  const [formData, setFormData] = useState({
    noteNumber: "",
    clientId: "",
    noteDate: new Date(),
    destinationCountry: "",
    deliveryLocation: "",
    currency: "USD",
    notes: "",
    items: [] as DeliveryNoteItem[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAllClients, getAllActiveProducts } = await import("../../../_lib/actions");

        const [clientsResult, productsResult] = await Promise.all([
          getAllClients(),
          getAllActiveProducts(),
        ]);

        if (clientsResult.data) {
          setClients(clientsResult.data);
        }
        if (productsResult.data) {
          setProducts(productsResult.data);
        }
      } catch (error) {
        console.error("Error fetching data", error);
        toast.error("Erreur lors du chargement des données");
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          productId: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          lineTotal: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: keyof DeliveryNoteItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      // If product changed, update related fields
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          item.productName = product.name;
          item.unitPrice = product.salePriceExport || 0;
        }
      }

      // Recalculate line total: (quantity * unitPrice) * (1 - discountPercent/100)
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = subtotal * (item.discountPercent / 100);
      item.lineTotal = subtotal - discountAmount;

      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculate totals
  const totalAmount = formData.items.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.clientId) {
        toast.error("Veuillez sélectionner un client");
        setLoading(false);
        return;
      }

      if (!formData.destinationCountry) {
        toast.error("Veuillez saisir le pays de destination");
        setLoading(false);
        return;
      }

      if (formData.items.length === 0) {
        toast.error("Veuillez ajouter au moins un produit");
        setLoading(false);
        return;
      }

      const { addDeliveryNote } = await import("../../../_lib/actions");
      const result = await addDeliveryNote({
        noteNumber: formData.noteNumber,
        noteType: "export",
        clientId: formData.clientId,
        noteDate: formData.noteDate,
        status: "active",
        currency: formData.currency,
        destinationCountry: formData.destinationCountry,
        deliveryLocation: formData.deliveryLocation || undefined,
        notes: formData.notes || undefined,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          lineTotal: item.lineTotal,
        })),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Bon de livraison export créé avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.push("/dashboard/export");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la création du bon de livraison",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/export")}
            className="hover:bg-muted"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouveau Bon de Livraison Export</h1>
            <p className="text-muted-foreground">Création d'un bon de livraison pour vente export</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Note Details Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              N° Bon de Livraison *
            </label>
            <Input
              placeholder="Ex: BL-EXP-2023-001"
              value={formData.noteNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, noteNumber: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Client *</label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, clientId: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formData.noteDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  {formData.noteDate ? (
                    format(formData.noteDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.noteDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, noteDate: date }));
                    }
                  }}
                  disabled={loading}
                  initialFocus
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pays de destination *</label>
            <Input
              placeholder="Ex: France, Espagne..."
              value={formData.destinationCountry}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, destinationCountry: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Devise</label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, currency: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="DZD">DZD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-foreground">Lieu de livraison</label>
            <Input
              placeholder="Adresse de livraison (optionnel)"
              value={formData.deliveryLocation}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deliveryLocation: e.target.value }))
              }
              disabled={loading}
            />
          </div>
        </div>

        {/* Product Lines Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-card-foreground">Lignes de produits</h2>
            <Button
              type="button"
              variant="link"
              onClick={addItem}
              disabled={loading}
              className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1"
            >
              <Plus size={16} />
              Ajouter un produit
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3 w-1/3">Produit</th>
                  <th className="px-4 py-3 w-24 text-right">Qté</th>
                  <th className="px-4 py-3 w-32 text-right">Prix Unitaire</th>
                  <th className="px-4 py-3 w-24 text-right">Remise %</th>
                  <th className="px-4 py-3 w-32 text-right">Total</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formData.items.map((item, index) => (
                  <tr key={item.id} className="text-card-foreground">
                    <td className="px-4 py-2">
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, "productId", value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discountPercent}
                        onChange={(e) =>
                          updateItem(index, "discountPercent", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-card-foreground">
                      {item.lineTotal.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={loading}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {formData.items.length > 0 && (
                <tfoot className="bg-muted font-medium">
                  <tr className="text-lg font-bold text-card-foreground">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right">
                      {totalAmount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {formData.currency}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <label className="text-sm font-medium text-foreground mb-2 block">Notes</label>
          <Textarea
            placeholder="Notes (optionnel)"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            disabled={loading}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/export")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer le bon de livraison
          </Button>
        </div>
      </form>
    </div>
  );
}


