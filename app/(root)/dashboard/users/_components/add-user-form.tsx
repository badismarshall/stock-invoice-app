"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import {
  SignUpFormValues,
  signUpSchema,
} from "@/app/(auth)/_lib/authform.schema";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import { Eye, EyeOff } from "lucide-react"

interface AddUserFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void;
}

// Helper function to generate username from firstName and lastName
function generateUsername(firstName: string, lastName: string): string {
  const first = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!first && !last) return '';
  if (!first) return last;
  if (!last) return first;
  
  return `${first}_${last}`;
}

export function AddUserForm({ className, onSuccess, ...props }: AddUserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '', 
      email: '',
      password: '',
      password_confirmation: '',
    },
  })

  // Generate username automatically when firstName or lastName changes
  useEffect(() => {
    const generatedUsername = generateUsername(firstName, lastName);
    form.setValue('username', generatedUsername, { shouldValidate: false });
  }, [firstName, lastName, form])

  async function onSubmit(values: SignUpFormValues) {
      // Combine firstName and lastName for the name field
      const fullName = `${firstName} ${lastName}`.trim();
      
      await signUp.email({
        email: values.email,
        password: values.password,
        name: fullName || values.username, // Use full name if available, otherwise use username
        callbackURL: `/dashboard/administrator`,
        fetchOptions: {
          onResponse: () => {
            setLoading(false);
          },
          onRequest: () => {
            setLoading(true);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Échec de l'ajout de l'utilisateur", {
              position: "bottom-center",
              duration: 3000,
            })
          },
          onSuccess: async () => {
            toast.success("Ajout de l'utilisateur réussi", {
              position: "bottom-center",
              duration: 3000,
            })
            router.refresh();
            // Reset form
            form.reset();
            setFirstName('');
            setLastName('');
            // Close dialog
            onSuccess?.();
          },
        },
      });
  }

  return (
    <>
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-6", className)}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Prénom
            </label>
            <Input
              id="firstName"
              placeholder="Prénom"
              type="text"
              disabled={loading}
              required
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
              }}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Nom
            </label>
            <Input
              id="lastName"
              placeholder="Nom"
              type="text"
              disabled={loading}
              required
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
              }}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="email">
                Adresse e-mail
              </FormLabel>
              <FormControl>
                <Input
                    id="email"
                    placeholder="exemple@domaine.fr"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
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
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel>
                Mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Votre mot de passe"
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={loading}
                    required
                    {...field}
                  />
                  <Button 
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    size="icon"
                    type="button"
                    variant="ghost"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4 text-muted-foreground" /> 
                    : <Eye className="size-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              <FormDescription className="text-gray-400 text-xs">
                Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.
              </FormDescription> 
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password_confirmation"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel>
                Confirmation du mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    placeholder="Confirmation du mot de passe"
                    type={showPasswordConfirmation ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={loading}
                    required
                    {...field}
                    autoComplete="new-password"
                  />
                  <Button 
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    size="icon"
                    type="button"
                    variant="ghost"
                    tabIndex={-1}
                  >
                    {showPasswordConfirmation ? <EyeOff className="size-4 text-muted-foreground" /> 
                    : <Eye className="size-4 text-muted-foreground" />}
                  </Button>
                </div>
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
            "Ajouter l'utilisateur"
          )}
        </Button>
      </form>
    </Form>
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
    </div>
    </>
  )
}