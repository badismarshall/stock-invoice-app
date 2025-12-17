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

interface InvoiceItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export function NewInvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string;
    salePriceLocal: number | null;
    salePriceExport: number | null;
    purchasePrice: number;
    taxRate: number;
    unitOfMeasure: string;
  }>>([]);

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceType: "sale_local" as "sale_local" | "sale_export" | "proforma" | "purchase" | "sale_invoice" | "delivery_note_invoice",
    clientId: "",
    supplierId: "",
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    deliveryNoteId: "",
    destinationCountry: "",
    deliveryLocation: "",
    currency: "DZD",
    notes: "",
    items: [] as InvoiceItem[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAllClients, getAllSuppliers, getAllActiveProducts } = await import("../../_lib/actions");

        const [clientsResult, suppliersResult, productsResult] = await Promise.all([
          getAllClients(),
          getAllSuppliers(),
          getAllActiveProducts(),
        ]);

        if (clientsResult.data) {
          setClients(clientsResult.data);
        }
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
          unitPrice: 0,
          discountPercent: 0,
          taxRate: 0,
          lineSubtotal: 0,
          lineTax: 0,
          lineTotal: 0,
        },
      ],
    }));
  };

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate when product, quantity, unitPrice, discountPercent, or taxRate changes
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) {
            const price = formData.invoiceType === "sale_export" 
              ? (product.salePriceExport || 0)
              : (product.salePriceLocal || product.purchasePrice || 0);
            updated.unitPrice = price;
            updated.taxRate = product.taxRate;
            updated.productName = product.name;
          }
        }

        if (field === "quantity" || field === "unitPrice" || field === "discountPercent" || field === "taxRate" || field === "productId") {
          const qty = updated.quantity;
          const price = updated.unitPrice;
          const discount = updated.discountPercent;
          const tax = updated.taxRate;

          const subtotal = qty * price;
          const discountAmount = subtotal * (discount / 100);
          updated.lineSubtotal = subtotal - discountAmount;
          updated.lineTax = updated.lineSubtotal * (tax / 100);
          updated.lineTotal = updated.lineSubtotal + updated.lineTax;
        }

        return updated;
      }),
    }));
  };

  const totalHT = formData.items.reduce((acc, item) => acc + item.lineSubtotal, 0);
  const totalTVA = formData.items.reduce((acc, item) => acc + item.lineTax, 0);
  const totalTTC = formData.items.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.invoiceType === "purchase" && !formData.supplierId) {
        toast.error("Veuillez sélectionner un fournisseur");
        setLoading(false);
        return;
      }

      if ((formData.invoiceType === "sale_local" || formData.invoiceType === "sale_export" || formData.invoiceType === "proforma" || formData.invoiceType === "sale_invoice" || formData.invoiceType === "delivery_note_invoice") && !formData.clientId) {
        toast.error("Veuillez sélectionner un client");
        setLoading(false);
        return;
      }

      if (formData.items.length === 0) {
        toast.error("Veuillez ajouter au moins un produit");
        setLoading(false);
        return;
      }

      const { addInvoice } = await import("../../_lib/actions");
      const result = await addInvoice({
        invoiceNumber: formData.invoiceNumber,
        invoiceType: formData.invoiceType,
        clientId: formData.invoiceType === "purchase" ? undefined : formData.clientId,
        supplierId: formData.invoiceType === "purchase" ? formData.supplierId : undefined,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        status: "active",
        paymentStatus: "unpaid",
        currency: formData.currency,
        destinationCountry: formData.destinationCountry || undefined,
        deliveryLocation: formData.deliveryLocation || undefined,
        deliveryNoteId: formData.deliveryNoteId || undefined,
        notes: formData.notes || undefined,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
          lineSubtotal: item.lineSubtotal,
          lineTax: item.lineTax,
          lineTotal: item.lineTotal,
        })),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Facture créée avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.push("/dashboard/invoices");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la création de la facture",
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
            onClick={() => router.push("/dashboard/invoices")}
            className="hover:bg-muted"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouvelle Facture</h1>
            <p className="text-muted-foreground">Création d'une nouvelle facture</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              N° Facture *
            </label>
            <Input
              placeholder="Ex: FAC-2023-001"
              value={formData.invoiceNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type de facture *</label>
            <Select
              value={formData.invoiceType}
              onValueChange={(value: "sale_local" | "sale_export" | "proforma" | "purchase" | "sale_invoice" | "delivery_note_invoice") =>
                setFormData((prev) => ({ ...prev, invoiceType: value, clientId: "", supplierId: "", deliveryNoteId: "", destinationCountry: "", currency: "DZD" }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale_local">Vente locale</SelectItem>
                <SelectItem value="sale_export">Vente export</SelectItem>
                <SelectItem value="proforma">Facture de Proforma</SelectItem>
                <SelectItem value="sale_invoice">Facture de Vente</SelectItem>
                <SelectItem value="delivery_note_invoice">Bon de Livraison</SelectItem>
                <SelectItem value="purchase">Achat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.invoiceType === "purchase" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Fournisseur *</label>
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
          ) : (
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
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formData.invoiceDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  {formData.invoiceDate ? (
                    format(formData.invoiceDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.invoiceDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, invoiceDate: date }));
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
            <label className="text-sm font-medium text-foreground">Date d'échéance</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, dueDate: date }));
                    }
                  }}
                  disabled={loading}
                  initialFocus
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          </div>

          {(formData.invoiceType === "sale_export" || formData.invoiceType === "proforma" || formData.invoiceType === "sale_invoice" || formData.invoiceType === "delivery_note_invoice") && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pays de destination</label>
                <Input
                  placeholder="Ex: France, Espagne..."
                  value={formData.destinationCountry}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, destinationCountry: e.target.value }))
                  }
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
                    <SelectItem value="DZD">DZD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Lieu de livraison</label>
            <Input
              placeholder="Adresse de livraison"
              value={formData.deliveryLocation}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deliveryLocation: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <Textarea
              placeholder="Notes additionnelles..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              disabled={loading}
              rows={3}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Produits</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold">Produit</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">Qté</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">Prix unitaire</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">Remise %</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">TVA %</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">Total HT</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">TVA</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold">Total TTC</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <tr key={item.id} className="border-t border-border hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(item.id, "productId", value)}
                            disabled={loading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionner un produit" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((prod) => (
                                <SelectItem key={prod.id} value={prod.id}>
                                  {prod.code} - {prod.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            step="0.001"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 0)}
                            className="w-full text-right no-spinner"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPrice.toFixed(2)}
                            onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value) || 0)}
                            className="w-full text-right no-spinner"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={item.discountPercent.toFixed(2)}
                            onChange={(e) => updateItem(item.id, "discountPercent", Number(e.target.value) || 0)}
                            className="w-full text-right no-spinner"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.taxRate.toFixed(2)}
                            onChange={(e) => updateItem(item.id, "taxRate", Number(e.target.value) || 0)}
                            className="w-full text-right no-spinner"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-right">{item.lineSubtotal.toFixed(2)} DZD</td>
                        <td className="px-4 py-2 text-sm text-right">{item.lineTax.toFixed(2)} DZD</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{item.lineTotal.toFixed(2)} DZD</td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/50 border-t-2 border-border">
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-right font-semibold">
                      Total HT:
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{totalHT.toFixed(2)} DZD</td>
                    <td className="px-4 py-2 text-right font-semibold">{totalTVA.toFixed(2)} DZD</td>
                    <td className="px-4 py-2 text-right font-bold text-lg">{totalTTC.toFixed(2)} DZD</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button type="submit" disabled={loading || formData.items.length === 0}>
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer la facture
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

