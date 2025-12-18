"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createPayment, updatePayment, getAllPaymentMethods } from "../../payments/_lib/actions";
import type { CreatePaymentInput, UpdatePaymentInput } from "@/data/payment/payment.dto";

const paymentFormSchema = z.object({
  paymentDate: z.date({
    message: "La date de paiement est requise",
  }),
  amount: z.number({
    message: "Le montant est requis",
  }).positive("Le montant doit être supérieur à 0").min(0.01, "Le montant doit être au moins 0.01"),
  paymentMethod: z.enum(["cash", "check", "transfer", "other"], {
    message: "La méthode de paiement est requise",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  invoiceId: string;
  invoiceTotal: number;
  totalPaid: number;
  paymentId?: string; // If provided, we're editing
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  invoiceId,
  invoiceTotal,
  totalPaid,
  paymentId,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [loadingPayment, setLoadingPayment] = React.useState(false);
  const [paymentMethods, setPaymentMethods] = React.useState<
    Array<{ value: string; label: string }>
  >([]);
  const [existingAmount, setExistingAmount] = React.useState(0);

  const remainingAmount = invoiceTotal - totalPaid;
  const isEditing = !!paymentId;

  React.useEffect(() => {
    const fetchPaymentMethods = async () => {
      const result = await getAllPaymentMethods();
      if (result.data) {
        setPaymentMethods(result.data);
      }
    };
    fetchPaymentMethods();
  }, []);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentDate: new Date(),
      amount: undefined as any,
      paymentMethod: "cash",
      reference: "",
      notes: "",
    },
    mode: "onBlur",
  });

  // If editing, load existing payment data
  React.useEffect(() => {
    if (paymentId) {
      const loadPayment = async () => {
        setLoadingPayment(true);
        try {
          const { getPaymentById } = await import("../../payments/_lib/actions");
          const result = await getPaymentById({ id: paymentId });
          if (result.data) {
            form.reset({
              paymentDate: result.data.paymentDate,
              amount: result.data.amount,
              paymentMethod: result.data.paymentMethod as "cash" | "check" | "transfer" | "other",
              reference: result.data.reference || "",
              notes: result.data.notes || "",
            });
            setExistingAmount(result.data.amount);
          }
        } catch (error) {
          console.error("Error loading payment", error);
        } finally {
          setLoadingPayment(false);
        }
      };
      loadPayment();
    }
  }, [paymentId, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    console.log("Form submitted with data:", data);
    
    // Validate amount
    if (!data.amount || data.amount <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      setLoading(false);
      return;
    }

    // Validate payment method
    if (!data.paymentMethod) {
      toast.error("Veuillez sélectionner une méthode de paiement");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // If editing, get existing payment amount
      let existingAmountValue = 0;
      if (isEditing && paymentId) {
        try {
          const { getPaymentById } = await import("../../payments/_lib/actions");
          const result = await getPaymentById({ id: paymentId });
          if (result.data) {
            existingAmountValue = result.data.amount;
          }
        } catch (error) {
          console.error("Error getting existing payment", error);
        }
      }

      // Calculate max amount (remaining + existing if editing)
      const maxAmount = isEditing
        ? remainingAmount + existingAmountValue
        : remainingAmount;

      if (data.amount > maxAmount + 0.01) {
        toast.error(
          `Le montant (${data.amount.toFixed(2)}) dépasse le montant restant (${maxAmount.toFixed(2)})`
        );
        setLoading(false);
        return;
      }

      if (isEditing && paymentId) {
        const updateInput: UpdatePaymentInput = {
          id: paymentId,
          paymentDate: data.paymentDate,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference || undefined,
          notes: data.notes || undefined,
        };
        console.log("Updating payment with:", updateInput);
        const result = await updatePayment(updateInput);
        console.log("Update result:", result);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Paiement modifié avec succès");
          onSuccess?.();
        }
      } else {
        const createInput: CreatePaymentInput = {
          invoiceId,
          paymentDate: data.paymentDate,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference || undefined,
          notes: data.notes || undefined,
        };
        console.log("Creating payment with:", createInput);
        const result = await createPayment(createInput);
        console.log("Create result:", result);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Paiement créé avec succès");
          form.reset();
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPayment) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
        console.error("Form validation errors:", errors);
        if (Object.keys(errors).length > 0) {
          toast.error("Veuillez corriger les erreurs du formulaire");
        }
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de paiement</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
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
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={isEditing ? remainingAmount + existingAmount : remainingAmount}
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === null || value === undefined) {
                      field.onChange(undefined as any);
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue > 0) {
                        field.onChange(numValue);
                      } else {
                        field.onChange(undefined as any);
                      }
                    }
                  }}
                  value={field.value === undefined || field.value === null ? "" : field.value}
                />
              </FormControl>
              <FormDescription>
                Montant restant: {remainingAmount.toFixed(2)} DZD
                {isEditing && ` (max: ${(remainingAmount + existingAmount).toFixed(2)} DZD)`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Méthode de paiement</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
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
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Référence (optionnel)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Numéro de chèque"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes supplémentaires..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

