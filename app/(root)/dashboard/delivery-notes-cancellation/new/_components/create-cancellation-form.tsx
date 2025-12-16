"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Checkbox } from "lucide-react"
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
import { Checkbox as UICheckbox } from "@/components/ui/checkbox"
import type { ClientDeliveryNoteItemDTO } from "@/data/delivery-note-cancellation/delivery-note-cancellation-item.dto"

interface SelectedItem {
  deliveryNoteItemId: string;
  quantity: number;
  availableQuantity: number;
}

export function CreateCancellationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [clientItems, setClientItems] = useState<ClientDeliveryNoteItemDTO[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [loadingItems, setLoadingItems] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    cancellationDate: new Date(),
    reason: "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { getAllClients } = await import("../../_lib/actions");
        const result = await getAllClients();
        if (result.data) {
          setClients(result.data);
        }
      } catch (error) {
        console.error("Error fetching clients", error);
        toast.error("Erreur lors du chargement des clients");
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchClientItems = async () => {
      if (!formData.clientId) {
        setClientItems([]);
        setSelectedItems(new Map());
        return;
      }

      setLoadingItems(true);
      try {
        const { getClientDeliveryNoteItemsAction } = await import("../../_lib/actions");
        const result = await getClientDeliveryNoteItemsAction({ clientId: formData.clientId });
        if (result.data) {
          setClientItems(result.data);
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("Error fetching client items", error);
        toast.error("Erreur lors du chargement des produits");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchClientItems();
  }, [formData.clientId]);

  const toggleItemSelection = (item: ClientDeliveryNoteItemDTO) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(item.deliveryNoteItemId)) {
        newMap.delete(item.deliveryNoteItemId);
      } else {
        newMap.set(item.deliveryNoteItemId, {
          deliveryNoteItemId: item.deliveryNoteItemId,
          quantity: item.availableQuantity > 0 ? 1 : 0,
          availableQuantity: item.availableQuantity,
        });
      }
      return newMap;
    });
  };

  const updateCancellationQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const selected = newMap.get(itemId);
      if (selected) {
        const clampedQuantity = Math.max(0, Math.min(quantity, selected.availableQuantity));
        newMap.set(itemId, {
          ...selected,
          quantity: clampedQuantity,
        });
      }
      return newMap;
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTax = 0;
    let totalTTC = 0;

    selectedItems.forEach((selected, itemId) => {
      const item = clientItems.find((i) => i.deliveryNoteItemId === itemId);
      if (item && selected.quantity > 0) {
        const proportion = selected.quantity / item.originalQuantity;
        const lineSubtotal = item.lineTotal * proportion;
        // Estimate tax (assuming lineTotal includes tax)
        const estimatedTax = lineSubtotal * 0.19; // Default 19% VAT
        const lineHT = lineSubtotal - estimatedTax;
        totalHT += lineHT;
        totalTax += estimatedTax;
        totalTTC += lineSubtotal;
      }
    });

    return { totalHT, totalTax, totalTTC };
  };

  const { totalHT, totalTax, totalTTC } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.clientId) {
        toast.error("Veuillez sélectionner un client");
        setLoading(false);
        return;
      }

      const itemsToCancel = Array.from(selectedItems.values()).filter(
        (item) => item.quantity > 0
      );

      if (itemsToCancel.length === 0) {
        toast.error("Veuillez sélectionner au moins un produit à annuler");
        setLoading(false);
        return;
      }

      const { createPartialDeliveryNoteCancellation } = await import("../../_lib/actions");
      const result = await createPartialDeliveryNoteCancellation({
        clientId: formData.clientId,
        cancellationDate: formData.cancellationDate,
        reason: formData.reason || undefined,
        items: itemsToCancel,
      });

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success("Annulation créée avec succès");
      router.push("/dashboard/delivery-notes-cancellation");
    } catch (error) {
      console.error("Error creating cancellation", error);
      toast.error("Erreur lors de la création de l'annulation");
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
            onClick={() => router.push("/dashboard/delivery-notes-cancellation")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nouvelle Annulation</h1>
            <p className="text-muted-foreground">
              Créer une annulation partielle de bon de livraison
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
        {/* Client Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client *</label>
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
            <label className="text-sm font-medium">Date d'annulation *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.cancellationDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.cancellationDate ? (
                    format(formData.cancellationDate, "PPP", { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.cancellationDate}
                  onSelect={(date) =>
                    date && setFormData((prev) => ({ ...prev, cancellationDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Raison de l'annulation (optionnel)</label>
          <Textarea
            value={formData.reason}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Raison de l'annulation..."
            disabled={loading}
            rows={3}
          />
        </div>

        {/* Items Table */}
        {formData.clientId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Produits vendus au client</h3>
              {loadingItems && <Icons.spinner className="h-4 w-4 animate-spin" />}
            </div>

            {loadingItems ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des produits...
              </div>
            ) : clientItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun produit trouvé pour ce client
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold w-12">
                          <span className="sr-only">Sélectionner</span>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold min-w-[120px]">
                          N° BL
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold min-w-[100px]">
                          Date BL
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold min-w-[200px]">
                          Produit
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                          Qté originale
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                          Qté annulée
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                          Qté disponible
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[100px]">
                          Prix unitaire
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[90px]">
                          Remise %
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[110px]">
                          Total ligne
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold min-w-[120px]">
                          Qté à annuler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientItems.map((item) => {
                        const isSelected = selectedItems.has(item.deliveryNoteItemId);
                        const selected = selectedItems.get(item.deliveryNoteItemId);
                        const isDisabled = item.availableQuantity <= 0;

                        return (
                          <tr
                            key={item.deliveryNoteItemId}
                            className={cn(
                              "border-b hover:bg-muted/50",
                              isSelected && "bg-muted/30",
                              isDisabled && "opacity-50"
                            )}
                          >
                            <td className="px-4 py-2">
                              <UICheckbox
                                checked={isSelected}
                                onCheckedChange={() => toggleItemSelection(item)}
                                disabled={isDisabled || loading}
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">{item.noteNumber}</td>
                            <td className="px-4 py-2 text-sm">
                              {format(item.noteDate, "dd/MM/yyyy")}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div>
                                <div className="font-medium">
                                  {item.productName || "-"}
                                </div>
                                {item.productCode && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.productCode}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.originalQuantity.toFixed(3)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.cancelledQuantity.toFixed(3)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <span
                                className={cn(
                                  item.availableQuantity > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                {item.availableQuantity.toFixed(3)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.unitPrice.toFixed(2)} DZD
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.discountPercent.toFixed(2)}%
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.lineTotal.toFixed(2)} DZD
                            </td>
                            <td className="px-4 py-2">
                              {isSelected ? (
                                <Input
                                  type="number"
                                  min={0}
                                  max={selected?.availableQuantity}
                                  step="0.001"
                                  value={selected?.quantity || 0}
                                  onChange={(e) =>
                                    updateCancellationQuantity(
                                      item.deliveryNoteItemId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full text-right no-spinner"
                                  disabled={loading || isDisabled}
                                />
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        {selectedItems.size > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-end gap-8">
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Total HT</div>
                <div className="text-lg font-semibold">{totalHT.toFixed(2)} DZD</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Total TVA</div>
                <div className="text-lg font-semibold">{totalTax.toFixed(2)} DZD</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Total TTC</div>
                <div className="text-lg font-semibold">{totalTTC.toFixed(2)} DZD</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/delivery-notes-cancellation")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading || selectedItems.size === 0}>
            {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}

