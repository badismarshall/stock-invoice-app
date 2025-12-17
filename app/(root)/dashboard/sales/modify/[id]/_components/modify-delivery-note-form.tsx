"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";

interface DeliveryNoteItem {
  id: string;
  productId: string;
  productName?: string | null;
  purchasePrice: number;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  margin: number;
  marginPercent: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

interface DeliveryNoteData {
  id: string;
  noteNumber: string;
  noteType: string;
  clientId: string | null;
  clientName: string | null;
  noteDate: Date;
  status: string | null;
  currency: string | null;
  destinationCountry: string | null;
  deliveryLocation: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    deliveryNoteId: string;
    productId: string;
    productCode: string | null;
    productName: string | null;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    lineTotal: number;
  }>;
}

interface ModifyDeliveryNoteFormProps {
  deliveryNote: DeliveryNoteData;
}

export function ModifyDeliveryNoteForm({ deliveryNote }: ModifyDeliveryNoteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      purchasePrice: number;
      salePriceLocal: number | null;
      taxRate: number;
      unitOfMeasure: string;
    }>
  >([]);

  const [formData, setFormData] = useState({
    noteNumber: deliveryNote.noteNumber,
    clientId: deliveryNote.clientId || "",
    noteDate: deliveryNote.noteDate,
    deliveryLocation: deliveryNote.deliveryLocation || "",
    notes: deliveryNote.notes || "",
    items: [] as DeliveryNoteItem[],
  });

  // Initialize items with computed tax, margins, and subtotals
  useEffect(() => {
    const initialItems: DeliveryNoteItem[] = deliveryNote.items.map((item) => {
      const quantity = item.quantity;
      const unitPrice = item.unitPrice;
      const discountPercent = item.discountPercent || 0;
      const gross = quantity * unitPrice;
      const discountAmount = gross * (discountPercent / 100);
      const lineSubtotal = gross - discountAmount;
      // We don't know exact taxRate from DB, approximate from lineTotal if possible
      const lineTotal = item.lineTotal;
      const taxBase = lineSubtotal > 0 ? lineTotal - lineSubtotal : 0;
      const taxRate =
        lineSubtotal > 0 ? (taxBase / lineSubtotal) * 100 : 0;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        purchasePrice: 0, // will be filled from products list
        quantity,
        unitPrice,
        discountPercent,
        taxRate,
        margin: 0,
        marginPercent: 0,
        lineSubtotal,
        lineTax: taxBase,
        lineTotal,
      };
    });

    setFormData((prev) => ({
      ...prev,
      items: initialItems,
    }));
  }, [deliveryNote]);

  // Fetch clients and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const actionsModule = await import("../../../_lib/actions");
        const [clientsResult, productsResult] = await Promise.all([
          actionsModule.getAllClients(),
          actionsModule.getAllActiveProducts(),
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

  // After products are loaded, enrich purchasePrice and margin
  useEffect(() => {
    if (products.length === 0 || formData.items.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const purchasePrice = product?.purchasePrice ?? 0;
        const margin = item.unitPrice - purchasePrice;
        const marginPercent = purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;

        return {
          ...item,
          purchasePrice,
          margin,
          marginPercent,
        };
      }),
    }));
  }, [products]);

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          productId: "",
          productName: undefined,
          purchasePrice: 0,
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          taxRate: 0,
          margin: 0,
          marginPercent: 0,
          lineSubtotal: 0,
          lineTax: 0,
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
          item.purchasePrice = product.purchasePrice || 0;
          item.unitPrice = product.salePriceLocal || 0;
          item.taxRate = product.taxRate || 0;
          // Calculate initial margin
          item.margin = item.unitPrice - item.purchasePrice;
          item.marginPercent =
            item.purchasePrice > 0 ? (item.margin / item.purchasePrice) * 100 : 0;
        }
      }

      // If unitPrice changed, recalculate margin
      if (field === "unitPrice") {
        item.margin = item.unitPrice - item.purchasePrice;
        item.marginPercent =
          item.purchasePrice > 0 ? (item.margin / item.purchasePrice) * 100 : 0;
      }

      // If margin changed, recalculate unitPrice
      if (field === "margin") {
        item.unitPrice = item.purchasePrice + item.margin;
        item.marginPercent =
          item.purchasePrice > 0 ? (item.margin / item.purchasePrice) * 100 : 0;
      }

      // Recalculate line totals
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = subtotal * (item.discountPercent / 100);
      item.lineSubtotal = subtotal - discountAmount;
      item.lineTax = item.lineSubtotal * (item.taxRate / 100);
      item.lineTotal = item.lineSubtotal + item.lineTax;

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
  const totalHT = formData.items.reduce((acc, item) => acc + item.lineSubtotal, 0);
  const totalTax = formData.items.reduce((acc, item) => acc + item.lineTax, 0);
  const totalTTC = formData.items.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.clientId) {
        toast.error("Veuillez sélectionner un client");
        setLoading(false);
        return;
      }

      if (formData.items.length === 0) {
        toast.error("Veuillez ajouter au moins un produit");
        setLoading(false);
        return;
      }

      const { updateDeliveryNote } = await import("../../../_lib/actions");
      const result = await updateDeliveryNote({
        id: deliveryNote.id,
        noteNumber: formData.noteNumber,
        noteType: (deliveryNote.noteType as "local" | "export") || "local",
        clientId: formData.clientId,
        noteDate: formData.noteDate,
        status: deliveryNote.status || "active",
        currency: deliveryNote.currency || "DZD",
        deliveryLocation: formData.deliveryLocation || undefined,
        notes: formData.notes || undefined,
        items: formData.items.map((item) => ({
          id: item.id,
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

      toast.success("Bon de livraison modifié avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.push("/dashboard/sales");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Échec de la modification du bon de livraison",
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
            onClick={() => router.push("/dashboard/sales")}
            className="hover:bg-muted"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Modifier Bon de Livraison
            </h1>
            <p className="text-muted-foreground">
              Modification d'un bon de livraison pour vente locale
            </p>
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
              placeholder="Ex: BL-2023-001"
              value={formData.noteNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, noteNumber: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Client *
            </label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, clientId: value }))
              }
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
            <label className="text-sm font-medium text-foreground">
              Date du Bon de Livraison *
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.noteDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.noteDate ? (
                    format(formData.noteDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.noteDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      noteDate: date || prev.noteDate,
                    }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-foreground">
              Lieu de Livraison
            </label>
            <Input
              placeholder="Adresse ou lieu de livraison"
              value={formData.deliveryLocation}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deliveryLocation: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <Textarea
              placeholder="Notes supplémentaires..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Produits du bon de livraison
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold min-w-[200px]">
                      Produit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                      Qté
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[110px]">
                      Prix d&apos;achat
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[110px]">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[90px]">
                      Remise %
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[90px]">
                      TVA %
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                      Marge
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                      % Marge
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[110px]">
                      Total HT
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                      TVA
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold min-w-[120px]">
                      Total TTC
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold min-w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2 min-w-[200px]">
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            updateItem(index, "productId", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner un produit" />
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
                      <td className="px-4 py-2 text-right min-w-[100px]">
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", Number(e.target.value) || 0)
                          }
                          className="w-full text-right no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[110px]">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.purchasePrice.toFixed(2)}
                          disabled
                          className="w-full text-right bg-muted/50 no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[110px]">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", Number(e.target.value) || 0)
                          }
                          className="w-full text-right no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[90px]">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={item.discountPercent}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "discountPercent",
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-full text-right no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[90px]">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) =>
                            updateItem(index, "taxRate", Number(e.target.value) || 0)
                          }
                          className="w-full text-right no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[100px]">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.margin.toFixed(2)}
                          onChange={(e) =>
                            updateItem(index, "margin", Number(e.target.value) || 0)
                          }
                          className="w-full text-right no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[100px]">
                        <Input
                          type="number"
                          value={Number.isFinite(item.marginPercent) ? item.marginPercent.toFixed(2) : "0.00"}
                          disabled
                          className="w-full text-right bg-muted/50 no-spinner"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-right min-w-[110px]">
                        {item.lineSubtotal.toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-2 text-sm text-right min-w-[100px]">
                        {item.lineTax.toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-2 text-sm text-right min-w-[120px]">
                        {item.lineTotal.toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-2 text-center min-w-[80px]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {formData.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        Aucun produit ajouté. Cliquez sur &quot;Ajouter un produit&quot; pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <div className="space-y-1 text-right">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Total HT
                </span>
                <span className="font-semibold">
                  {totalHT.toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Total TVA
                </span>
                <span className="font-semibold">
                  {totalTax.toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Total TTC
                </span>
                <span className="font-semibold">
                  {totalTTC.toFixed(2)} DZD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/sales")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


