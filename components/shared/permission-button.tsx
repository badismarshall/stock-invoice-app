"use client";

import * as React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Button, ButtonProps } from "@/components/ui/button";
import Link from "next/link";

interface PermissionButtonProps extends Omit<ButtonProps, "asChild"> {
  permission: string | string[];
  href?: string;
  requireAll?: boolean;
  children: React.ReactNode;
}

/**
 * Button component that only renders if user has the required permission(s)
 */
export function PermissionButton({
  permission,
  href,
  requireAll = false,
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? canAll(permission)
      : canAny(permission)
    : can(permission);

  if (!hasAccess) {
    return null;
  }

  if (href) {
    return (
      <Link href={href}>
        <Button {...buttonProps}>{children}</Button>
      </Link>
    );
  }

  return <Button {...buttonProps}>{children}</Button>;
}

