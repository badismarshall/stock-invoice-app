"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

const modifyPartnerSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  credit: z.string().optional(),
  nif: z.string().optional(),
  rc: z.string().optional(),
});

type ModifyPartnerFormValues = z.infer<typeof modifyPartnerSchema>;

interface ModifyPartnerFormProps extends React.HTMLAttributes<HTMLDivElement> {
  partner: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    credit: string | null;
    nif: string | null;
    rc: string | null;
    type: string;
  };
  onSuccess?: () => void
}

export function ModifyPartnerForm({ className, partner, onSuccess, ...props }: ModifyPartnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ModifyPartnerFormValues>({
    resolver: zodResolver(modifyPartnerSchema),
    defaultValues: {
      name: partner.name || '',
      phone: partner.phone || '',
      email: partner.email || '',
      address: partner.address || '',
      credit: partner.credit || '0',
      nif: partner.nif || '',
      rc: partner.rc || '',
    },
  })

  // Update form when partner changes
  useEffect(() => {
    form.reset({
      name: partner.name || '',
      phone: partner.phone || '',
      email: partner.email || '',
      address: partner.address || '',
      credit: partner.credit || '0',
      nif: partner.nif || '',
      rc: partner.rc || '',
    });
  }, [partner, form]);

  async function onSubmit(values: ModifyPartnerFormValues) {
    setLoading(true);
    try {
      const { updatePartner } = await import("../_lib/actions");
      const result = await updatePartner({
        id: partner.id,
        ...values,
        credit: values.credit || "0",
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`${partner.type === "client" ? "Client" : "Fournisseur"} modifié avec succès`, {
        position: "bottom-center",
        duration: 3000,
      });
      
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la modification du partenaire", {
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
                Nom / Raison Sociale
              </FormLabel>
              <FormControl>
                <Input
                    id="name"
                    placeholder="Nom ou raison sociale"
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="phone">
                  Téléphone
                </FormLabel>
                <FormControl>
                  <Input
                      id="phone"
                      placeholder="Numéro de téléphone"
                      type="tel"
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
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="email">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                      id="email"
                      placeholder="Adresse email"
                      type="email"
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
          name="address"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="address">
                Adresse
              </FormLabel>
              <FormControl>
                <Input
                    id="address"
                    placeholder="Adresse complète"
                    type="text"
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
          name="credit"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="credit">
                Crédit
              </FormLabel>
              <FormControl>
                <Input
                    id="credit"
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nif"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="nif">
                  NIF
                </FormLabel>
                <FormControl>
                  <Input
                      id="nif"
                      placeholder="NIF"
                      type="text"
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
            name="rc"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="rc">
                  RC
                </FormLabel>
                <FormControl>
                  <Input
                      id="rc"
                      placeholder="RC"
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit"
          disabled={loading}   
        >
          {loading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            `Modifier ${partner.type === "client" ? "le client" : "le fournisseur"}`
          )}
        </Button>
      </form>
    </Form>
  )
}

