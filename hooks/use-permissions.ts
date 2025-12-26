"use client";

import { useSession } from "@/lib/auth-client";
import { useMemo } from "react";

/**
 * Hook to get current user permissions from session
 * @returns Object with permissions array and helper functions
 */
export function usePermissions() {
  const { data: session } = useSession();

  const permissions = useMemo(() => {
    if (!session?.user) {
      return [];
    }
    // Type assertion needed because Better Auth types don't include our custom fields
    return (session.user as any).permissions || [];
  }, [session]);

  /**
   * Check if user has a specific permission
   */
  const can = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissionList: string[]): boolean => {
    return permissionList.some((perm) => permissions.includes(perm));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissionList: string[]): boolean => {
    return permissionList.every((perm) => permissions.includes(perm));
  };

  return {
    permissions,
    can,
    canAny,
    canAll,
    isLoading: !session,
  };
}

