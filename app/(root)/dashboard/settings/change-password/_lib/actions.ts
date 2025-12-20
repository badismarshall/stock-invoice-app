"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { changePasswordSchema, type ChangePasswordSchema } from "./change-password.schema";
import { revalidatePath } from "next/cache";

export async function changePassword(input: ChangePasswordSchema) {
  try {
    // Validate input
    const validatedInput = changePasswordSchema.parse(input);

    // Call Better Auth API to change password
    const data = await auth.api.changePassword({
      body: {
        newPassword: validatedInput.newPassword,
        currentPassword: validatedInput.currentPassword,
        revokeOtherSessions: false, // Keep other sessions active
      },
      headers: await headers(),
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard/settings/change-password");

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error("Error changing password:", error);
    
    // Handle Better Auth errors
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = error.message as string;
      
      // Common error messages from Better Auth
      if (errorMessage.includes("current password") || errorMessage.includes("invalid password")) {
        return {
          success: false,
          error: "Le mot de passe actuel est incorrect",
        };
      }
      
      return {
        success: false,
        error: errorMessage || "Une erreur est survenue lors du changement de mot de passe",
      };
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as { issues: Array<{ message: string; path: string[] }> };
      const firstError = zodError.issues[0];
      return {
        success: false,
        error: firstError?.message || "Erreur de validation",
      };
    }

    return {
      success: false,
      error: "Une erreur est survenue lors du changement de mot de passe",
    };
  }
}

