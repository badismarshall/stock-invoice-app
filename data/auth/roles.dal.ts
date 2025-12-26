import "server-only";

import db from "@/db";
import {
  role,
  permissionDefinition,
  rolePermission,
  userRole,
  user,
} from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getErrorMessage } from "@/lib/handle-error";
import type {
  CreateRoleInput,
  UpdateRoleInput,
  AssignPermissionsToRoleInput,
  AssignRolesToUserInput,
  CreatePermissionInput,
} from "./roles.dto";

/**
 * Get all roles
 */
export async function getRoles() {
  try {
    const roles = await db
      .select()
      .from(role)
      .orderBy(role.createdAt);

    // Get user counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (r) => {
        const userRoles = await db
          .select()
          .from(userRole)
          .where(eq(userRole.roleId, r.id));
        
        return {
          ...r,
          userCount: userRoles.length,
        };
      })
    );

    return {
      data: rolesWithCounts,
      error: null,
    };
  } catch (err) {
    console.error("Error getting roles", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get role by ID with permissions
 */
export async function getRoleById(id: string) {
  try {
    const [roleData] = await db
      .select()
      .from(role)
      .where(eq(role.id, id))
      .limit(1);

    if (!roleData) {
      return {
        data: null,
        error: "Rôle non trouvé",
      };
    }

    // Get permissions for this role
    const permissions = await db
      .select({
        permission: permissionDefinition,
      })
      .from(rolePermission)
      .innerJoin(
        permissionDefinition,
        eq(rolePermission.permissionId, permissionDefinition.id)
      )
      .where(eq(rolePermission.roleId, id));

    return {
      data: {
        ...roleData,
        permissions: permissions.map((p) => p.permission),
      },
      error: null,
    };
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
    const { generateId } = await import("@/lib/data-table/id");
    const id = generateId();

    const [newRole] = await db
      .insert(role)
      .values({
        id,
        name: input.name,
        label: input.label,
        description: input.description || null,
      })
      .returning();

    return {
      data: newRole,
      error: null,
    };
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
    const updateData: Partial<typeof role.$inferInsert> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.label !== undefined) updateData.label = input.label;
    if (input.description !== undefined) updateData.description = input.description || null;

    const [updatedRole] = await db
      .update(role)
      .set(updateData)
      .where(eq(role.id, input.id))
      .returning();

    if (!updatedRole) {
      return {
        data: null,
        error: "Rôle non trouvé",
      };
    }

    return {
      data: updatedRole,
      error: null,
    };
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
    await db.delete(role).where(eq(role.id, id));

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting role", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all permission definitions
 */
export async function getPermissions() {
  try {
    const permissions = await db
      .select()
      .from(permissionDefinition)
      .orderBy(permissionDefinition.category, permissionDefinition.name);

    return {
      data: permissions,
      error: null,
    };
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
    const { generateId } = await import("@/lib/data-table/id");
    const id = generateId();

    const [newPermission] = await db
      .insert(permissionDefinition)
      .values({
        id,
        name: input.name,
        description: input.description || null,
        category: input.category || null,
      })
      .returning();

    return {
      data: newPermission,
      error: null,
    };
  } catch (err) {
    console.error("Error creating permission", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Set permissions for a role (replaces all existing permissions)
 */
export async function setRolePermissions(input: AssignPermissionsToRoleInput) {
  try {
    await db.transaction(async (tx) => {
      // Delete existing permissions for this role
      await tx.delete(rolePermission).where(eq(rolePermission.roleId, input.roleId));

      // Insert new permissions
      if (input.permissionIds.length > 0) {
        const { generateId } = await import("@/lib/data-table/id");
        const rolePermissions = input.permissionIds.map((permissionId) => ({
          id: generateId(),
          roleId: input.roleId,
          permissionId,
        }));

        await tx.insert(rolePermission).values(rolePermissions);
      }
    });

    return {
      data: { roleId: input.roleId, permissionIds: input.permissionIds },
      error: null,
    };
  } catch (err) {
    console.error("Error setting role permissions", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all permissions for a user (aggregated from all their roles)
 */
export async function getUserPermissions(userId: string) {
  try {
    // Get all roles for the user
    const userRoles = await db
      .select({ roleId: userRole.roleId })
      .from(userRole)
      .where(eq(userRole.userId, userId));

    if (userRoles.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const roleIds = userRoles.map((ur) => ur.roleId);

    // Get all permissions for these roles
    const permissions = await db
      .selectDistinct({ name: permissionDefinition.name })
      .from(rolePermission)
      .innerJoin(
        permissionDefinition,
        eq(rolePermission.permissionId, permissionDefinition.id)
      )
      .where(inArray(rolePermission.roleId, roleIds));

    return {
      data: permissions.map((p) => p.name),
      error: null,
    };
  } catch (err) {
    console.error("Error getting user permissions", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Assign roles to a user (replaces all existing roles)
 */
export async function assignRolesToUser(input: AssignRolesToUserInput) {
  try {
    await db.transaction(async (tx) => {
      // Delete existing roles for this user
      await tx.delete(userRole).where(eq(userRole.userId, input.userId));

      // Insert new roles
      if (input.roleIds.length > 0) {
        const { generateId } = await import("@/lib/data-table/id");
        const userRoles = input.roleIds.map((roleId) => ({
          id: generateId(),
          userId: input.userId,
          roleId,
        }));

        await tx.insert(userRole).values(userRoles);
      }
    });

    return {
      data: { userId: input.userId, roleIds: input.roleIds },
      error: null,
    };
  } catch (err) {
    console.error("Error assigning roles to user", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string) {
  try {
    const roles = await db
      .select({
        role: role,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(eq(userRole.userId, userId));

    return {
      data: roles.map((r) => r.role),
      error: null,
    };
  } catch (err) {
    console.error("Error getting user roles", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all roles for multiple users (batch load)
 * Returns a map of userId -> role[]
 */
export async function getUsersRoles(userIds: string[]) {
  try {
    if (userIds.length === 0) {
      return {
        data: {} as Record<string, typeof role.$inferSelect[]>,
        error: null,
      };
    }

    const userRoles = await db
      .select({
        userId: userRole.userId,
        role: role,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(inArray(userRole.userId, userIds));

    // Group by userId
    const rolesByUser = userRoles.reduce(
      (acc, { userId, role }) => {
        if (!acc[userId]) {
          acc[userId] = [];
        }
        acc[userId].push(role);
        return acc;
      },
      {} as Record<string, typeof role.$inferSelect[]>,
    );

    return {
      data: rolesByUser,
      error: null,
    };
  } catch (err) {
    console.error("Error getting users roles", err);
    return {
      data: {} as Record<string, typeof role.$inferSelect[]>,
      error: getErrorMessage(err),
    };
  }
}

