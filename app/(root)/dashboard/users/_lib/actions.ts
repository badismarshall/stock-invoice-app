"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import {
  getUserById as getUserByIdDAL,
  updateUser as updateUserDAL,
  deleteUser as deleteUserDAL,
  deleteUsers as deleteUsersDAL,
  seedUsers as seedUsersDAL,
} from "@/data/user/user.dal";
import type { UpdateUserSchema } from "./update-user.schemas";
import { assignUserRoles } from "@/app/(root)/dashboard/roles/_lib/actions";
import { requirePermission } from "@/lib/authz";

export async function getUserById(input: { id: string }) {
  try {
    const user = await getUserByIdDAL(input.id);
    
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      data: user,
      error: null,
    };
  } catch (err) {
    console.error("Error getting user by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function seedUsers(input: { count: number }) {
  const count = input.count ?? 100;

  try {
    await seedUsersDAL(count);
    console.log("📝 Seeded users", count);
  } catch (err) {
    console.error("Error seeding users", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }

  return {
    data: null,
    error: null,
  };
}

export async function updateUser(input: UpdateUserSchema & { id: string }) {
  try {
    const updateData: Parameters<typeof updateUserDAL>[0] = {
      id: input.id,
    };

    // Combine firstName and lastName if provided
    if (input.firstName || input.lastName) {
      const firstName = input.firstName || "";
      const lastName = input.lastName || "";
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    if (input.email !== undefined) updateData.email = input.email;
    if (input.emailVerified !== undefined) {
      updateData.emailVerified = input.emailVerified;
    }

    await updateUserDAL(updateData);

    // Handle password update separately through better-auth if provided
    // Note: Admin password reset might need a different approach
    // For now, password updates are handled through better-auth's admin APIs
    // You may need to implement a custom admin password reset endpoint
    if (input.password !== undefined && input.password !== "") {
      // TODO: Implement admin password reset using better-auth admin APIs
      // This typically requires admin privileges and a different API endpoint
      console.warn("Password update not yet implemented for admin users");
    }

    updateTag("users");
    updateTag("user-role-counts");
    updateTag("user-email-verified-counts");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Assign roles to a user
 */
export async function assignRolesToUser(input: { userId: string; roleIds: string[] }) {
  try {
    await requirePermission("settings.manage_users");
    
    const result = await assignUserRoles({
      userId: input.userId,
      roleIds: input.roleIds,
    });

    if (result.error) {
      return {
        data: null,
        error: result.error,
      };
    }

    updateTag("users");
    updateTag("roles");

    return {
      data: result.data,
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

export async function deleteUser(input: { id: string }) {
  try {
    await deleteUserDAL(input.id);
    updateTag("users");
    updateTag("user-role-counts");
    updateTag("user-email-verified-counts");
    updateTag("user-banned-counts");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteUsers(input: { ids: string[] }) {
  try {
    await deleteUsersDAL(input.ids);
    updateTag("users");
    updateTag("user-role-counts");
    updateTag("user-email-verified-counts");
    updateTag("user-banned-counts");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
