import { z } from "zod";

/**
 * Schema for creating a role
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  label: z.string().min(1, "Le label est requis").max(100, "Le label est trop long"),
  description: z.string().optional().nullable(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

/**
 * Schema for updating a role
 */
export const updateRoleSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long").optional(),
  label: z.string().min(1, "Le label est requis").max(100, "Le label est trop long").optional(),
  description: z.string().optional().nullable(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

/**
 * Schema for assigning permissions to a role
 */
export const assignPermissionsToRoleSchema = z.object({
  roleId: z.string().min(1, "L'ID du rôle est requis"),
  permissionIds: z.array(z.string()).min(1, "Au moins une permission est requise"),
});

export type AssignPermissionsToRoleInput = z.infer<typeof assignPermissionsToRoleSchema>;

/**
 * Schema for assigning roles to a user
 */
export const assignRolesToUserSchema = z.object({
  userId: z.string().min(1, "L'ID de l'utilisateur est requis"),
  roleIds: z.array(z.string()).min(1, "Au moins un rôle est requis"),
});

export type AssignRolesToUserInput = z.infer<typeof assignRolesToUserSchema>;

/**
 * Schema for creating a permission definition
 */
export const createPermissionSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

