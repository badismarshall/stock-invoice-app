"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

const addProductSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unitOfMeasure: z.string().min(1, "L'unité de mesure est requise"),
  purchasePrice: z.string().optional(),
  salePriceLocal: z.string().optional(),
  salePriceExport: z.string().optional(),
  taxRate: z.string().optional(),
  isActive: z.boolean(),
});

type AddProductFormValues = z.infer<typeof addProductSchema>;

interface AddProductFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void
}

export function AddProductForm({ className, onSuccess, ...props }: AddProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch categories on mount
    const fetchCategories = async () => {
      try {
        const { getAllActiveCategories } = await import("../_lib/actions");
        const result = await getAllActiveCategories();
        if (result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error("Error fetching categories", error);
      }
    };
    fetchCategories();
  }, []);

  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      categoryId: '',
      unitOfMeasure: 'unité',
      purchasePrice: '0',
      salePriceLocal: '0',
      salePriceExport: '',
      taxRate: '0',
      isActive: true,
    },
  })

  async function onSubmit(values: AddProductFormValues) {
    setLoading(true);
    try {
      const { addProduct } = await import("../_lib/actions");
      const result = await addProduct({
        ...values,
        categoryId: values.categoryId || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Produit ajouté avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      form.reset();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'ajout du produit", {
        position: "bottom-center",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-4", className)}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="code">
                  Code
                </FormLabel>
                <FormControl>
                  <Input
                    id="code"
                    placeholder="Code du produit"
                    type="text"
                    disabled={loading}
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="unitOfMeasure">
                  Unité de mesure
                </FormLabel>
                <FormControl>
                  <Input
                    id="unitOfMeasure"
                    placeholder="unité, kg, L, etc."
                    type="text"
                    disabled={loading}
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="name">
                Nom du produit
              </FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder="Nom du produit"
                  type="text"
                  disabled={loading}
                  required
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="categoryId">
                Catégorie
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* <SelectItem value="null">Aucune catégorie</SelectItem> */}
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
          name="description"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="description">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  id="description"
                  placeholder="Description du produit (optionnel)"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="purchasePrice">
                  Prix d'achat
                </FormLabel>
                <FormControl>
                  <Input
                    id="purchasePrice"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePriceLocal"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="salePriceLocal">
                  Prix de vente local
                </FormLabel>
                <FormControl>
                  <Input
                    id="salePriceLocal"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePriceExport"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="salePriceExport">
                  Prix de vente export
                </FormLabel>
                <FormControl>
                  <Input
                    id="salePriceExport"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="taxRate">
                Taux de TVA (%)
              </FormLabel>
              <FormControl>
                <Input
                  id="taxRate"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Ajouter le produit"
          )}
        </Button>
      </form>
    </Form>
  )
}

