"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getUsers as getUsersDAL, getUserRoleCounts as getUserRoleCountsDAL, getUserBannedCounts as getUserBannedCountsDAL, getUserEmailVerifiedCounts as getUserEmailVerifiedCountsDAL } from "@/data/user/user.dal";
import type { GetUsersSchema } from "./validation";

export async function getUsers(input: GetUsersSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("users");

  try {
    const result = await getUsersDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.users, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getUsers service", error);
    return { data: [], pageCount: 0 };
  }
}

export async function getUserRoleCounts() {
  cacheLife("hours");
  cacheTag("user-role-counts");

  try {
    return await getUserRoleCountsDAL();
  } catch (error) {
    console.error("Error in getUserRoleCounts service", error);
    return {} as Record<string, number>;
  }
}

export async function getUserBannedCounts() {
  cacheLife("hours");
  cacheTag("user-banned-counts");

  try {
    return await getUserBannedCountsDAL();
  } catch (error) {
    console.error("Error in getUserBannedCounts service", error);
    return {
      banned: 0,
      active: 0,
    };
  }
}

export async function getUserEmailVerifiedCounts() {
  cacheLife("hours");
  cacheTag("user-email-verified-counts");

  try {
    return await getUserEmailVerifiedCountsDAL();
  } catch (error) {
    console.error("Error in getUserEmailVerifiedCounts service", error);
    return {
      verified: 0,
      unverified: 0,
    };
  }
}