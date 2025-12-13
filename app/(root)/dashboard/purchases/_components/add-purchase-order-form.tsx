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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

const addPurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, "Le numéro de commande est requis"),
  supplierId: z.string().min(1, "Le fournisseur est requis"),
  orderDate: z.date(),
  receptionDate: z.date().optional(),
  status: z.enum(["pending", "received", "cancelled"]),
  totalAmount: z.string().optional(),
  notes: z.string().optional(),
});

type AddPurchaseOrderFormValues = z.infer<typeof addPurchaseOrderSchema>;

interface AddPurchaseOrderFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void
}

export function AddPurchaseOrderForm({ className, onSuccess, ...props }: AddPurchaseOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch suppliers on mount
    const fetchSuppliers = async () => {
      try {
        const { getAllSuppliers } = await import("../_lib/actions");
        const result = await getAllSuppliers();
        if (result.data) {
          setSuppliers(result.data);
        }
      } catch (error) {
        console.error("Error fetching suppliers", error);
      }
    };
    fetchSuppliers();
  }, []);

  const form = useForm<AddPurchaseOrderFormValues>({
    resolver: zodResolver(addPurchaseOrderSchema),
    defaultValues: {
      orderNumber: '',
      supplierId: '',
      orderDate: new Date(), // Today's date
      receptionDate: new Date(),
      status: 'pending',
      totalAmount: '0',
      notes: '',
    },
  })

  async function onSubmit(values: AddPurchaseOrderFormValues) {
    setLoading(true);
    try {
      const { addPurchaseOrder } = await import("../_lib/actions");
      const result = await addPurchaseOrder({
        ...values,
        receptionDate: values.receptionDate,   
        totalAmount: values.totalAmount || undefined,
        notes: values.notes || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Bon de commande ajouté avec succès", {
        position: "bottom-center",
        duration: 3000,
      });

      form.reset({
        orderNumber: '',
        supplierId: '',
        orderDate: new Date(),
        receptionDate: new Date(),
        status: 'pending',
        totalAmount: '0',
        notes: '',
      });
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'ajout du bon de commande", {
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
          name="orderNumber"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="orderNumber">
                Numéro de commande
              </FormLabel>
              <FormControl>
                <Input
                  id="orderNumber"
                  placeholder="BC-2024-001"
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
          name="supplierId"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="supplierId">
                Fournisseur
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel>
                  Date de commande
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={loading}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP", { locale: fr })
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                        } else {
                          field.onChange('');
                        }
                      }}
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
          <FormField
            control={form.control}
            name="receptionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel>
                  Date de réception
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={loading}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP", { locale: fr })
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                        } else {
                          field.onChange('');
                        }
                      }}
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="status">
                  Statut
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="received">Reçu</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="totalAmount">
                  Montant total
                </FormLabel>
                <FormControl>
                  <Input
                    id="totalAmount"
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
          name="notes"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="notes">
                Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  id="notes"
                  placeholder="Notes (optionnel)"
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
            "Ajouter le bon de commande"
          )}
        </Button>
      </form>
    </Form>
  )
}

