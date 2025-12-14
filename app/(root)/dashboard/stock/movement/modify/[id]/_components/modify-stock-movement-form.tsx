"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import type { StockMovementDTOItem } from "@/data/stock/stock.dto"

const updateStockMovementSchema = z.object({
  productId: z.string().min(1, "Le produit est requis"),
  movementType: z.enum(["in", "out", "adjustment"], {
    error: "Le type de mouvement est requis",
  }),
  quantity: z.number().min(0.001, "La quantité doit être supérieure à 0"),
  unitCost: z.number().min(0, "Le coût unitaire ne peut pas être négatif"),
  movementDate: z.date({
    error: "La date de mouvement est requise",
  }),
  notes: z.string().optional(),
});

type UpdateStockMovementFormValues = z.infer<typeof updateStockMovementSchema>;

interface ModifyStockMovementFormProps {
  movement: StockMovementDTOItem;
}

export function ModifyStockMovementForm({ movement }: ModifyStockMovementFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string;
    purchasePrice: string | null;
    unitOfMeasure: string;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAllActiveProducts } = await import("../../../../_lib/actions");
        const productsResult = await getAllActiveProducts();
        if (productsResult.data) {
          setProducts(productsResult.data);
        }
      } catch (error) {
        console.error("Error fetching products", error);
        toast.error("Erreur lors du chargement des produits");
      }
    };
    fetchData();
  }, []);

  const form = useForm<UpdateStockMovementFormValues>({
    resolver: zodResolver(updateStockMovementSchema),
    defaultValues: {
      productId: movement.productId,
      movementType: movement.movementType as "in" | "out" | "adjustment",
      quantity: movement.quantity,
      unitCost: movement.unitCost || 0,
      movementDate: movement.movementDate,
      notes: movement.notes || '',
    },
  });

  async function onSubmit(values: UpdateStockMovementFormValues) {
    setLoading(true);
    try {
      const { updateStockMovement } = await import("../../../../_lib/actions");
      const result = await updateStockMovement({
        id: movement.id,
        ...values,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Mouvement de stock modifié avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      router.push("/dashboard/stock/movements");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la modification du mouvement",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === form.watch("productId"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/stock/movements")}
            className="hover:bg-muted"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modifier Mouvement de Stock</h1>
            <p className="text-muted-foreground">Modifier un mouvement d'ajustement de stock</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
            <h2 className="font-bold text-foreground">Détails du mouvement</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produit *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de mouvement *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">Entrée</SelectItem>
                        <SelectItem value="out">Sortie</SelectItem>
                        <SelectItem value="adjustment">Ajustement</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantité * {selectedProduct && `(${selectedProduct.unitOfMeasure})`}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût unitaire (DZD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movementDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de mouvement *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={loading}
                            type="button"
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={loading}
                          initialFocus
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes sur ce mouvement (optionnel)"
                      {...field}
                      disabled={loading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/stock/movements")}
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
      </Form>
    </div>
  );
}

