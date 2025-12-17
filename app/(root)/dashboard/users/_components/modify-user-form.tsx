"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { type UpdateUserSchema, getUpdateUserSchema } from "../_lib/update-user.schemas"

interface ModifyUserFormProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    banned: boolean;
    createdAt: Date;
  };
  onSuccess?: () => void
}

const userRoles = ["admin", "user", "moderator"] as const;
const userRoleLabels: Record<string, string> = {
  admin: "Administrateur",
  user: "Utilisateur",
  moderator: "Modérateur",
};

export function ModifyUserForm({ className, user, onSuccess, ...props }: ModifyUserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Split name into firstName and lastName
  const nameParts = user.name?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const form = useForm<UpdateUserSchema>({
    resolver: zodResolver(getUpdateUserSchema()),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
      email: user.email || '',
      password: '',
      role: user.role || '',
      emailVerified: user.emailVerified ?? false,
    },
  })

  // Update form when user changes
  useEffect(() => {
    const nameParts = user.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    form.reset({
      firstName: firstName,
      lastName: lastName,
      email: user.email || '',
      password: '',
      role: user.role || '',
      emailVerified: user.emailVerified ?? false,
    });
  }, [user, form]);

  async function onSubmit(values: UpdateUserSchema) {
    setLoading(true);
    try {
      const { updateUser } = await import("../_lib/actions");
      const result = await updateUser({
        id: user.id,
        ...values,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Utilisateur modifié avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
      
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la modification de l'utilisateur", {
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
            name="firstName"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="firstName">
                  Prénom
                </FormLabel>
                <FormControl>
                  <Input
                      id="firstName"
                      placeholder="Prénom"
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
            name="lastName"
            render={({ field }) => (
              <FormItem className="grid gap-1">
                <FormLabel htmlFor="lastName">
                  Nom
                </FormLabel>
                <FormControl>
                  <Input
                      id="lastName"
                      placeholder="Nom"
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="password">
                Mot de passe
              </FormLabel>
              <FormControl>
                <Input
                    id="password"
                    placeholder="Laisser vide pour conserver le mot de passe actuel"
                    type="password"
                    disabled={loading}
                    {...field}
                    value={field.value || ""}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="role">
                Rôle
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {userRoles.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="capitalize"
                      >
                        {userRoleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emailVerified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Email vérifié</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Marquer l&apos;email de cet utilisateur comme vérifié
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
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
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Modification...
            </>
          ) : (
            "Modifier l'utilisateur"
          )}
        </Button>
      </form>
    </Form>
  )
}

