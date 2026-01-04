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
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

const addUnitOfMeasureSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  symbol: z.string().min(1, "Le symbole est requis"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type AddUnitOfMeasureFormValues = z.infer<typeof addUnitOfMeasureSchema>;

interface AddUnitOfMeasureFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void
}

export function AddUnitOfMeasureForm({ className, onSuccess, ...props }: AddUnitOfMeasureFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddUnitOfMeasureFormValues>({
    resolver: zodResolver(addUnitOfMeasureSchema),
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      isActive: true,
    },
  })

  async function onSubmit(values: AddUnitOfMeasureFormValues) {
    setLoading(true);
    try {
      const { addUnitOfMeasure } = await import("../_lib/actions");
      const result = await addUnitOfMeasure(values);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Unité de mesure ajoutée avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
      
      form.reset();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'ajout de l'unité de mesure", {
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

        <Button 
          type="submit"
          disabled={loading}   
        >
          {loading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Ajouter l'unité de mesure"
          )}
        </Button>
      </form>
    </Form>
  )
}

