import * as z from "zod";

export function getUpdateUserSchema(t?: (key: string) => string) {
  return z
    .object({
      firstName: z.string().min(1, t ? t("first_name_required") : "First Name is required.").optional(),
      lastName: z.string().min(1, t ? t("last_name_required") : "Last Name is required.").optional(),
      username: z.string().min(1, t ? t("username_required") : "Username is required.").optional(),
      phoneNumber: z.string().min(1, t ? t("phone_number_required") : "Phone number is required.").optional(),
      email: z.string().trim().min(1, t ? t("email_required") : "Email is required.").email({ 
        message: t ? t("email_invalid") : "Email is invalid." 
      }).optional(),
      password: z.string()
        .min(8, t ? t("password_min") : "Le mot de passe doit être au moins de 8 caractères")
        .regex(/[A-Z]/, t ? t("password_uppercase") : "Le mot de passe doit contenir au moins une lettre majuscule")
        .regex(/[a-z]/, t ? t("password_lowercase") : "Le mot de passe doit contenir au moins une lettre minuscule") 
        .regex(/[0-9]/, t ? t("password_number") : "Le mot de passe doit contenir au moins un chiffre")
        .regex(/[@$!%*?&]/, t ? t("password_special_characters") : "Le mot de passe doit contenir au moins un caractère spécial")
        .optional()
        .or(z.literal("")),
      role: z.string().min(1, t ? t("role_required") : "Role is required.").optional(),
      emailVerified: z.boolean().optional(),
    });
}

export type UpdateUserSchema = z.infer<
  ReturnType<typeof getUpdateUserSchema>
>;
