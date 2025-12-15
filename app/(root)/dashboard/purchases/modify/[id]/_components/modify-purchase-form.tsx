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

interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  lineTotal: number;
}

interface PurchaseOrderData {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string | null;
  orderDate: Date;
  receptionDate: Date | null;
  status: string;
  totalAmount: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string | null;
    productCode: string | null;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
}

interface ModifyPurchaseFormProps {
  purchaseOrder: PurchaseOrderData;
}

export function ModifyPurchaseForm({ purchaseOrder }: ModifyPurchaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string;
    purchasePrice: string | null;
    taxRate: string | null;
    unitOfMeasure: string;
  }>>([]);

  const [formData, setFormData] = useState({
    orderNumber: purchaseOrder.orderNumber,
    supplierId: purchaseOrder.supplierId,
    orderDate: purchaseOrder.orderDate,
    receptionDate: purchaseOrder.receptionDate || new Date(),
    status: purchaseOrder.status as "pending" | "received" | "cancelled",
    notes: purchaseOrder.notes || "",
    items: purchaseOrder.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || undefined,
      productCode: item.productCode || undefined,
      quantity: item.quantity,
      unitCost: item.unitCost,
      taxRate: 0, // Calculate from lineTotal and unitCost
      lineTotal: item.lineTotal,
    })) as PurchaseOrderItem[],
  });

  useEffect(() => {
    // Calculate tax rate for existing items
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const subtotal = item.quantity * item.unitCost;
        const taxAmount = item.lineTotal - subtotal;
        const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;
        return { ...item, taxRate };
      }),
    }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ getAllSuppliers }, { getAllActiveProducts }] = await Promise.all([
          import("../../../_lib/actions"),
          import("../../../_lib/actions"),
        ]);

        const [suppliersResult, productsResult] = await Promise.all([
          getAllSuppliers(),
          getAllActiveProducts(),
        ]);

        if (suppliersResult.data) {
          setSuppliers(suppliersResult.data);
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
          unitCost: 0,
          taxRate: 0,
          lineTotal: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      // If product changed, update related fields
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          item.productName = product.name;
          item.productCode = product.code;
          item.unitCost = product.purchasePrice ? parseFloat(product.purchasePrice) : 0;
          item.taxRate = product.taxRate ? parseFloat(product.taxRate) : 0;
        }
      }

      // Recalculate line total
      const subtotal = item.quantity * item.unitCost;
      const taxAmount = subtotal * (item.taxRate / 100);
      item.lineTotal = subtotal + taxAmount;

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
  const totalHT = formData.items.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0
  );
  const totalTax = formData.items.reduce(
    (acc, item) => acc + item.quantity * item.unitCost * (item.taxRate / 100),
    0
  );
  const totalTTC = formData.items.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.supplierId) {
        toast.error("Veuillez sélectionner un fournisseur");
        setLoading(false);
        return;
      }

      // Allow saving purchase order even with 0 items

      const { updatePurchaseOrder } = await import("../../../_lib/actions");
      const result = await updatePurchaseOrder({
        id: purchaseOrder.id,
        orderNumber: formData.orderNumber,
        supplierId: formData.supplierId,
        orderDate: formData.orderDate,
        receptionDate: formData.receptionDate,
        status: formData.status,
        totalAmount: totalTTC.toString(),
        notes: formData.notes || undefined,
        items: formData.items.length > 0 
          ? formData.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lineTotal: item.lineTotal,
            }))
          : [], // Allow empty items array
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Bon de commande modifié avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.push("/dashboard/purchases");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la modification du bon de commande",
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
            onClick={() => router.push("/dashboard/purchases")}
            className="hover:bg-muted"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modifier Bon de Commande</h1>
            <p className="text-muted-foreground">Modification d'un bon de commande</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              N° Facture Fournisseur
            </label>
            <Input
              placeholder="Ex: FAC-2023-001"
              value={formData.orderNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, orderNumber: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Fournisseur</label>
            <Select
              value={formData.supplierId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, supplierId: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formData.orderDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  {formData.orderDate ? (
                    format(formData.orderDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.orderDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, orderDate: date }));
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
            <label className="text-sm font-medium text-foreground">Date de réception</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formData.receptionDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  {formData.receptionDate ? (
                    format(formData.receptionDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.receptionDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, receptionDate: date }));
                    } else {
                      setFormData((prev) => ({ ...prev, receptionDate: new Date() }));
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
            <label className="text-sm font-medium text-foreground">Statut</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value as "pending" | "received" | "cancelled" }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="received">Reçu</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
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
                  <th className="px-4 py-3 w-32 text-right">Prix Achat</th>
                  <th className="px-4 py-3 w-24 text-right">TVA %</th>
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
                        className="w-full text-right no-spinner"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(index, "unitCost", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right no-spinner"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateItem(index, "taxRate", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right no-spinner"
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
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-card-foreground">
                      Total HT
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">
                      {totalHT.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-card-foreground">
                      Total TVA
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">
                      {totalTax.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="text-lg font-bold text-card-foreground">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Total TTC
                    </td>
                    <td className="px-4 py-3 text-right">
                      {totalTTC.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      DZD
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
            onClick={() => router.push("/dashboard/purchases")}
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
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}

