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

const addCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type AddCategoryFormValues = z.infer<typeof addCategorySchema>;

interface AddCategoryFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void
}

export function AddCategoryForm({ className, onSuccess, ...props }: AddCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddCategoryFormValues>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  })

  async function onSubmit(values: AddCategoryFormValues) {
    setLoading(true);
    try {
      const { addCategory } = await import("../_lib/actions");
      const result = await addCategory(values);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Catégorie ajoutée avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
      
      form.reset();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'ajout de la catégorie", {
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
                Nom de la catégorie
              </FormLabel>
              <FormControl>
                <Input
                    id="name"
                    placeholder="Nom de la catégorie"
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
                    placeholder="Description de la catégorie (optionnel)"
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
            "Ajouter la catégorie"
          )}
        </Button>
      </form>
    </Form>
  )
}

