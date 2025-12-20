"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import { toast } from "sonner"

import {
  SignInFormValues,
  signInSchema,
} from "../../_lib/authform.schema";
import { useState } from "react"
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoginUserAuthForm({ className, ...props }: UserAuthFormProps) {

	const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: SignInFormValues) {
    await signIn.email(
      {
          email: values.email,
          password: values.password,
          rememberMe: true,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onResponse: () => {
          setLoading(false);
        },
        onError: (ctx: any) => {
          toast.error(ctx.error.message || "Échec de la connexion", 
            { 
              position: "bottom-center",
              duration: 3000,
            }
          );
        },
        onSuccess: () => {
          toast.success("Connexion réussie", 
          {
            position: "bottom-center",
            duration: 2000,
          });
          router.push("/dashboard/");
        },
      },
      );
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
          name="email"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel htmlFor="email">
                Email
              </FormLabel>
              <FormControl>
                <Input
                    required
                    id="email"
                    placeholder="Entrez votre email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
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
            <FormItem className="flex flex-col gap-1">
              <FormLabel>
                Mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                <Input
                    id="password"
                    placeholder="Entrez votre mot de passe"
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
                        : 
                        <Eye className="size-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              {/* <FormDescription className="text-primary text-end">
                <Link
                  href="/forget-password"
                  className="text-primary"
                >
                  Mot de passe oublié ?
                </Link>
              </FormDescription> */}
            </FormItem>
          )}
        />
        <Button 
          disabled={loading} 
          type="submit"
        >
          {loading ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            "Se connecter"
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Vous n'avez pas de compte ? {" "}
          <Link
                href="/sign-up"
                className="text-primary"
              >
                S'inscrire
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