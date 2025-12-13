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
import Link from "next/link"
import {
  SignUpFormValues,
  signUpSchema,
} from "../../_lib/authform.schema";
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import { Eye, EyeOff } from "lucide-react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignUpUserForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '', 
      email: '',
      password: '',
      password_confirmation: '',
    },
  })

  async function onSubmit(values: SignUpFormValues) {
      await signUp.email({
        email: values.email,
        password: values.password,
        name: values.username,
        callbackURL: `/dashboard/administrator`,
        fetchOptions: {
          onResponse: () => {
            setLoading(false);
          },
          onRequest: () => {
            setLoading(true);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Échec de l'inscription", {
              position: "bottom-center",
              duration: 3000,
            })
          },
          onSuccess: async () => {
            toast.success("Inscription réussie !", {
              position: "bottom-center",
              duration: 3000,
            })
            router.push("/verify");
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
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="username">
                Nom d'utilisateur
              </FormLabel>
              <FormControl>
                <Input
                    id="username"
                    placeholder="Votre nom d'utilisateur (ex: jean_dupond)"
                    type="text"
                    autoCapitalize="none"
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
            "S'inscrire"
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/sign-in"
            className="text-primary"
          >
            Se connecter
          </Link>
        </p>
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