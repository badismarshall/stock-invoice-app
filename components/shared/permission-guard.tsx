"use client";

import * as React from "react";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGuardProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
}

/**
 * Component that conditionally renders children based on user permissions
 * @param permission - Single permission string or array of permissions
 * @param children - Content to render if user has permission
 * @param fallback - Optional content to render if user doesn't have permission
 * @param requireAll - If true, user must have all permissions; if false, user needs any permission
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? canAll(permission)
      : canAny(permission)
    : can(permission);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

