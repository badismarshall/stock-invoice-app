import * as z from "zod";

// Base schemas (shadcn pattern)
export const signInSchema = z.object({
  email: z.string().trim().min(1, "Email est requis").email({
    message: "Email invalide",
  }),
  password: z.string().min(1, "Mot de passe est requis"),
});

export const signUpSchema = z
  .object({
    username: z
      .string()
      .min(6, "Nom d'utilisateur doit être au moins de 6 caractères")
      .max(20, "Nom d'utilisateur doit être au plus de 20 caractères")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres, des tirets et des underscores"
      )
      .refine((value) => !/^\d+$/.test(value), {
        message:
          "Le nom d'utilisateur ne peut pas contenir uniquement des chiffres",
      })
      .refine((value) => !/[@$!%*?&]/.test(value), {
        message:
          "Le nom d'utilisateur ne peut pas contenir de caractères spéciaux comme @$!%*?&",
      }),
    email: z.string().trim().min(1, "Email est requis").email({
      message: "Email invalide",
    }),
    password: z
      .string()
      .min(8, "Le mot de passe doit être au moins de 8 caractères")
      .regex(
        /[A-Z]/,
        "Le mot de passe doit contenir au moins une lettre majuscule"
      )
      .regex(
        /[a-z]/,
        "Le mot de passe doit contenir au moins une lettre minuscule"
      )
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
      .regex(
        /[@$!%*?&]/,
        "Le mot de passe doit contenir au moins un caractère spécial"
      ),
    password_confirmation: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Les mots de passe ne correspondent pas",
  });


export const forgetPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email est requis").email({
    message: "Email invalide",
  }),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(1, "Mot de passe est requis"),
});

// Type inference (shadcn pattern)
export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ForgetPasswordFormValues = z.infer<typeof forgetPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Helper functions to get translated schemas
export function getSignInSchema(t?: (key: string) => string) {
  if (!t) return signInSchema;
  return z.object({
    email: z.string().trim().min(1, t("email_required")).email({
      message: t("email_invalid"),
    }),
    password: z.string().min(1, t("password_required")),
  });
}

export function getSignUpSchema(t?: (key: string) => string) {
  if (!t) return signUpSchema;
  return z
    .object({
      username: z
        .string()
        .min(6, t("username_min"))
        .max(20, t("username_max"))
        .regex(/^[a-zA-Z0-9_-]+$/, t("username_regex"))
        .refine((value) => !/^\d+$/.test(value), {
          message: t("username_numbers"),
        })
        .refine((value) => !/[@$!%*?&]/.test(value), {
          message: t("username_special_characters"),
        }),
      email: z.string().trim().min(1, t("email_required")).email({
        message: t("email_invalid"),
      }),
      password: z
        .string()
        .min(8, t("password_min"))
        .regex(/[A-Z]/, t("password_uppercase"))
        .regex(/[a-z]/, t("password_lowercase"))
        .regex(/[0-9]/, t("password_numbers"))
        .regex(/[@$!%*?&]/, t("password_special_characters")),
      password_confirmation: z
        .string()
        .min(1, t("password_confirmation_required")),
    })
    .refine((data) => data.password === data.password_confirmation, {
      path: ["password_confirmation"],
      message: t("password_confirmation_match"),
    });
}


export function getForgetPasswordSchema(t?: (key: string) => string) {
  if (!t) return forgetPasswordSchema;
  return z.object({
    email: z.string().trim().min(1, t("email_required")).email({
      message: t("email_invalid"),
    }),
  });
}

export function getResetPasswordSchema(t?: (key: string) => string) {
  if (!t) return resetPasswordSchema;
  return z.object({
    password: z.string().min(1, t("password_required")),
  });
}
