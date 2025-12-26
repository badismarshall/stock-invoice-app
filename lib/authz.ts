import "server-only";

import { getCurrentUser } from "@/data/user/user-auth";
import { getUserPermissions } from "@/data/auth/roles.dal";
import { getErrorMessage } from "@/lib/handle-error";

/**
 * Get all permissions for the current user
 * This aggregates permissions from all user roles
 */
export async function getCurrentUserPermissions(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const result = await getUserPermissions(user.id);
    if (result.error || !result.data) {
      return [];
    }

    return result.data;
  } catch (err) {
    console.error("Error getting user permissions", err);
    return [];
  }
}

/**
 * Check if current user has a specific permission
 * @param permission - Permission name (e.g., "purchases.read", "sales.export")
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const permissions = await getCurrentUserPermissions();
    return permissions.includes(permission);
  } catch (err) {
    console.error("Error checking permission", err);
    return false;
  }
}

/**
 * Require a specific permission - throws error if user doesn't have it
 * Use this in server actions and route handlers
 * @param permission - Permission name (e.g., "purchases.read", "sales.export")
 * @throws Error if user is not authenticated or doesn't have the permission
 */
export async function requirePermission(permission: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    throw new Error(`Accès refusé : permission "${permission}" requise`);
  }
}

/**
 * Check if user has any of the specified permissions
 * @param permissions - Array of permission names
 * @returns true if user has at least one permission
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  try {
    const userPermissions = await getCurrentUserPermissions();
    return permissions.some((perm) => userPermissions.includes(perm));
  } catch (err) {
    console.error("Error checking permissions", err);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 * @param permissions - Array of permission names
 * @returns true if user has all permissions
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  try {
    const userPermissions = await getCurrentUserPermissions();
    return permissions.every((perm) => userPermissions.includes(perm));
  } catch (err) {
    console.error("Error checking permissions", err);
    return false;
  }
}

