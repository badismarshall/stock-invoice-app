"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { requirePermission } from "@/lib/authz";
import {
  getRoles as getRolesDAL,
  getRoleById as getRoleByIdDAL,
  createRole as createRoleDAL,
  updateRole as updateRoleDAL,
  deleteRole as deleteRoleDAL,
  setRolePermissions as setRolePermissionsDAL,
  assignRolesToUser as assignRolesToUserDAL,
  getUserRoles as getUserRolesDAL,
  getPermissions as getPermissionsDAL,
  createPermission as createPermissionDAL,
} from "@/data/auth/roles.dal";
import type {
  CreateRoleInput,
  UpdateRoleInput,
  AssignPermissionsToRoleInput,
  AssignRolesToUserInput,
  CreatePermissionInput,
} from "@/data/auth/roles.dto";
import { createRoleSchema, updateRoleSchema, assignPermissionsToRoleSchema, assignRolesToUserSchema, createPermissionSchema } from "@/data/auth/roles.dto";

/**
 * Get all roles
 */
export async function getRoles() {
  try {
    await requirePermission("settings.manage_roles");
    
    const result = await getRolesDAL();
    return result;
  } catch (err) {
    console.error("Error getting roles", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string) {
  try {
    await requirePermission("settings.manage_roles");
    
    const result = await getRoleByIdDAL(id);
    return result;
  } catch (err) {
    console.error("Error getting role by id", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Create a new role
 */
export async function createRole(input: CreateRoleInput) {
  try {
    await requirePermission("settings.manage_roles");
    
    // Validate input
    const validatedInput = createRoleSchema.parse(input);
    
    const result = await createRoleDAL(validatedInput);
    if (result.error) {
      return result;
    }
    
    updateTag("roles");
    
    return result;
  } catch (err) {
    console.error("Error creating role", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Update a role
 */
export async function updateRole(input: UpdateRoleInput) {
  try {
    await requirePermission("settings.manage_roles");
    
    // Validate input
    const validatedInput = updateRoleSchema.parse(input);
    
    const result = await updateRoleDAL(validatedInput);
    if (result.error) {
      return result;
    }
    
    updateTag("roles");
    
    return result;
  } catch (err) {
    console.error("Error updating role", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a role
 */
export async function deleteRole(id: string) {
  try {
    await requirePermission("settings.manage_roles");
    
    const result = await deleteRoleDAL(id);
    if (result.error) {
      return result;
    }
    
    updateTag("roles");
    
    return result;
  } catch (err) {
    console.error("Error deleting role", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all permissions
 */
export async function getPermissions() {
  try {
    await requirePermission("settings.manage_roles");
    
    const result = await getPermissionsDAL();
    return result;
  } catch (err) {
    console.error("Error getting permissions", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Create a permission definition
 */
export async function createPermission(input: CreatePermissionInput) {
  try {
    await requirePermission("settings.manage_roles");
    
    // Validate input
    const validatedInput = createPermissionSchema.parse(input);
    
    const result = await createPermissionDAL(validatedInput);
    if (result.error) {
      return result;
    }
    
    updateTag("permissions");
    
    return result;
  } catch (err) {
    console.error("Error creating permission", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Set permissions for a role
 */
export async function updateRolePermissions(input: AssignPermissionsToRoleInput) {
  try {
    await requirePermission("settings.manage_roles");
    
    // Validate input
    const validatedInput = assignPermissionsToRoleSchema.parse(input);
    
    const result = await setRolePermissionsDAL(validatedInput);
    if (result.error) {
      return result;
    }
    
    updateTag("roles");
    updateTag("permissions");
    
    return result;
  } catch (err) {
    console.error("Error updating role permissions", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Assign roles to a user
 */
export async function assignUserRoles(input: AssignRolesToUserInput) {
  try {
    await requirePermission("settings.manage_roles");
    
    // Validate input
    const validatedInput = assignRolesToUserSchema.parse(input);
    
    const result = await assignRolesToUserDAL(validatedInput);
    if (result.error) {
      return result;
    }
    
    updateTag("roles");
    updateTag("users");
    
    return result;
  } catch (err) {
    console.error("Error assigning roles to user", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get roles for a user
 */
export async function getUserRolesAction(userId: string) {
  try {
    await requirePermission("settings.manage_roles");
    
    const result = await getUserRolesDAL(userId);
    return result;
  } catch (err) {
    console.error("Error getting user roles", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

