import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import db from "@/db";
import { user } from "@/db/schema";
import type { GetUsersSchema } from "@/lib/validations/user";
import type { 
  UserDTO, 
  UserRoleCounts, 
  UserBannedCounts, 
  UserEmailVerifiedCounts 
} from "./user.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

export const getUsers = async (input: GetUsersSchema): Promise<UserDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: user,
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
    ? advancedWhere : and(
      // Search by name or email
      input.name || input.email
        ? or(
            input.name ? ilike(user.name, `%${input.name}%`) : undefined,
            input.email ? ilike(user.email, `%${input.email}%`) : undefined,
          )
        : undefined,
      // Filter by emailVerified
      input.emailVerified.length > 0
        ? inArray(user.emailVerified, input.emailVerified)
        : undefined,
      // Filter by role
      input.role.length > 0
        ? inArray(user.role, input.role)
        : undefined,
      // Filter by banned status
      input.banned.length > 0
        ? inArray(user.banned, input.banned)
        : undefined,
      // Filter by createdAt date range
      input.createdAt.length > 0
        ? and(
            input.createdAt[0]
              ? gte(
                  user.createdAt,
                  (() => {
                    const date = new Date(input.createdAt[0]);
                    date.setHours(0, 0, 0, 0);
                    return date;
                  })(),
                )
              : undefined,
            input.createdAt[1]
              ? lte(
                  user.createdAt,
                  (() => {
                    const date = new Date(input.createdAt[1]);
                    date.setHours(23, 59, 59, 999);
                    return date;
                  })(),
                )
              : undefined,
          )
        : undefined,
    );

    // Map sort IDs to actual user table columns
    const columnMap = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      role: user.role,
      banned: user.banned,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
            .map((item) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(user.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(user)
        .limit(input.perPage)
        .offset(offset)
        .where(where)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(user)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    return {
      users: data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        role: u.role || "",
        banned: u.banned ?? false,
        createdAt: u.createdAt,
      })),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting users", error);
    return {
      users: [],
      options: { totalCount: 0, limit: input.perPage, offset: (input.page - 1) * input.perPage },
    };
  }
};

export const getUserRoleCounts = async (): Promise<UserRoleCounts> => {
  try {
    return await db
      .select({
        role: user.role,
        count: count(),
      })
      .from(user)
      .groupBy(user.role)
      .then((res) =>
        res.reduce(
          (acc, { role, count }) => {
            if (role) {
              acc[role] = count;
            }
            return acc;
          },
          {} as Record<string, number>,
        ),
      );
  } catch (error) {
    console.error("Error getting user role counts", error);
    return {} as Record<string, number>;
  }
};

export const getUserBannedCounts = async (): Promise<UserBannedCounts> => {
  try {
    return await db
      .select({
        banned: user.banned,
        count: count(),
      })
      .from(user)
      .groupBy(user.banned)
      .then((res) =>
        res.reduce(
          (acc, { banned, count }) => {
            acc[banned ? "banned" : "active"] = count;
            return acc;
          },
          {
            banned: 0,
            active: 0,
          },
        ),
      );
  } catch (error) {
    console.error("Error getting user banned counts", error);
    return {
      banned: 0,
      active: 0,
    };
  }
};

export const getUserEmailVerifiedCounts = async (): Promise<UserEmailVerifiedCounts> => {
  try {
    return await db
      .select({
        emailVerified: user.emailVerified,
        count: count(),
      })
      .from(user)
      .groupBy(user.emailVerified)
      .then((res) =>
        res.reduce(
          (acc, { emailVerified, count }) => {
            acc[emailVerified ? "verified" : "unverified"] = count;
            return acc;
          },
          {
            verified: 0,
            unverified: 0,
          },
        ),
      );
  } catch (error) {
    console.error("Error getting user email verified counts", error);
    return {
      verified: 0,
      unverified: 0,
    };
  }
};

export const updateUser = async (input: {
  id: string;
  name?: string;
  email?: string;
  role?: string | null;
  emailVerified?: boolean;
}): Promise<void> => {
  try {
    const updateData: Partial<typeof user.$inferInsert> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.emailVerified !== undefined) updateData.emailVerified = input.emailVerified;

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, input.id));
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await db.delete(user).where(eq(user.id, id));
  } catch (error) {
    console.error("Error deleting user", error);
    throw error;
  }
};

export const deleteUsers = async (ids: string[]): Promise<void> => {
  try {
    await db.delete(user).where(inArray(user.id, ids));
  } catch (error) {
    console.error("Error deleting users", error);
    throw error;
  }
};

export const seedUsers = async (count: number): Promise<void> => {
  try {
    const { generateRandomUser } = await import("@/test/utils");
    
    const allUsers = [];
    for (let i = 0; i < count; i++) {
      allUsers.push(generateRandomUser());
    }

    await db.delete(user);
    await db.insert(user).values(allUsers).onConflictDoNothing();
  } catch (error) {
    console.error("Error seeding users", error);
    throw error;
  }
};