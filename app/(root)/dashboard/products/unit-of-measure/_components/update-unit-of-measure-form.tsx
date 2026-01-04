"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import type { UnitOfMeasureDTOItem } from "@/data/unit-of-measure/unit-of-measure.dto"

const updateUnitOfMeasureSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  symbol: z.string().min(1, "Le symbole est requis"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type UpdateUnitOfMeasureFormValues = z.infer<typeof updateUnitOfMeasureSchema>;

interface UpdateUnitOfMeasureFormProps {
  unitOfMeasure: UnitOfMeasureDTOItem;
  className?: string;
  onSuccess?: () => void
}

export function UpdateUnitOfMeasureForm({ unitOfMeasure, className, onSuccess }: UpdateUnitOfMeasureFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<UpdateUnitOfMeasureFormValues>({
    resolver: zodResolver(updateUnitOfMeasureSchema),
    defaultValues: {
      name: unitOfMeasure.name,
      symbol: unitOfMeasure.symbol,
      description: unitOfMeasure.description || '',
      isActive: unitOfMeasure.isActive,
    },
  })

  async function onSubmit(values: UpdateUnitOfMeasureFormValues) {
    setLoading(true);
    try {
      const { updateUnitOfMeasure } = await import("../_lib/actions");
      const result = await updateUnitOfMeasure({
        id: unitOfMeasure.id,
        ...values,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Unité de mesure modifiée avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
      
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la modification de l'unité de mesure", {
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="name">
                Nom de l'unité
              </FormLabel>
              <FormControl>
                <Input
                    id="name"
                    placeholder="Ex: Kilogramme"
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
          name="symbol"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="symbol">
                Symbole
              </FormLabel>
              <FormControl>
                <Input
                    id="symbol"
                    placeholder="Ex: kg"
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
          name="description"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="description">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                    id="description"
                    placeholder="Description de l'unité de mesure (optionnel)"
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Statut</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Active ou inactive cette unité de mesure
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                />
              </FormControl>
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
            "Enregistrer les modifications"
          )}
        </Button>
      </form>
    </Form>
  )
}

