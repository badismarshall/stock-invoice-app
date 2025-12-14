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

interface StockEntryItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitCost: number;
  movementDate: Date;
  notes: string;
}

export function NewStockForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string;
    purchasePrice: string | null;
    unitOfMeasure: string;
  }>>([]);

  const [formData, setFormData] = useState({
    items: [] as StockEntryItem[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAllActiveProducts } = await import("../../_lib/actions");

        const productsResult = await getAllActiveProducts();

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
          movementDate: new Date(),
          notes: "",
        },
      ],
    }));
  };

  const updateItem = (index: number, field: keyof StockEntryItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      // If product changed, update related fields
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          item.productName = product.name;
          item.unitCost = product.purchasePrice ? parseFloat(product.purchasePrice) : 0;
        }
      }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.items.length === 0) {
        toast.error("Veuillez ajouter au moins un produit");
        setLoading(false);
        return;
      }

      // Validate all items have required fields
      for (const item of formData.items) {
        if (!item.productId) {
          toast.error("Veuillez sélectionner un produit pour tous les éléments");
          setLoading(false);
          return;
        }
        if (item.quantity <= 0) {
          toast.error("La quantité doit être supérieure à 0");
          setLoading(false);
          return;
        }
        if (item.unitCost < 0) {
          toast.error("Le coût unitaire ne peut pas être négatif");
          setLoading(false);
          return;
        }
      }

      const { addStockEntry } = await import("../../_lib/actions");
      const result = await addStockEntry({
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          movementDate: item.movementDate,
          notes: item.notes || undefined,
        })),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Entrée de stock créée avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.push("/dashboard/stock");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la création de l'entrée de stock",
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
            onClick={() => router.push("/dashboard/stock")}
            className="hover:bg-muted"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouvelle Entrée de Stock</h1>
            <p className="text-muted-foreground">Ajouter des produits au stock</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  <th className="px-4 py-3 w-32 text-right">Coût Unitaire</th>
                  <th className="px-4 py-3 w-32">Date</th>
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
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(index, "unitCost", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !item.movementDate && "text-muted-foreground"
                            )}
                            disabled={loading}
                            type="button"
                          >
                            {item.movementDate ? (
                              format(item.movementDate, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={item.movementDate}
                            onSelect={(date) => {
                              if (date) {
                                updateItem(index, "movementDate", date);
                              }
                            }}
                            disabled={loading}
                            initialFocus
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
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
            </table>
          </div>
        </div>

        {/* Notes Section */}
        {formData.items.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Notes (optionnel)</h3>
            {formData.items.map((item, index) => (
              <div key={item.id} className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {item.productName || `Produit ${index + 1}`}
                </label>
                <Textarea
                  placeholder="Notes pour ce produit (optionnel)"
                  value={item.notes}
                  onChange={(e) => updateItem(index, "notes", e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/stock")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading || formData.items.length === 0}>
            {loading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer l'entrée de stock
          </Button>
        </div>
      </form>
    </div>
  );
}

