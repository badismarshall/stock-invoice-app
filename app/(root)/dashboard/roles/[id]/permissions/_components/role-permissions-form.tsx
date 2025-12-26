"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRolePermissions } from "../../../_lib/actions";
import { Icons } from "@/components/ui/icons";
import type { PermissionDefinition } from "@/db/schema/permission-definition";

interface RolePermissionsFormProps {
  role: {
    id: string;
    name: string;
    label: string;
    permissions: PermissionDefinition[];
  };
  allPermissions: PermissionDefinition[];
}

export function RolePermissionsForm({
  role,
  allPermissions,
}: RolePermissionsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(
    new Set(role.permissions.map((p) => p.id))
  );

  // Group permissions by category
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, PermissionDefinition[]> = {};
    for (const perm of allPermissions) {
      const category = perm.category || "Autres";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(perm);
    }
    return groups;
  }, [allPermissions]);

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSelectAll = (category: string) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const allSelected = categoryPermissions.every((p) =>
      selectedPermissions.has(p.id)
    );

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        categoryPermissions.forEach((p) => next.delete(p.id));
      } else {
        categoryPermissions.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateRolePermissions({
        roleId: role.id,
        permissionIds: Array.from(selectedPermissions),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Permissions mises à jour avec succès");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour des permissions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([category, permissions]) => {
          const allSelected = permissions.every((p) => selectedPermissions.has(p.id));
          const someSelected = permissions.some((p) => selectedPermissions.has(p.id));

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{category}</CardTitle>
                    <CardDescription>
                      {permissions.length} permission(s) disponible(s)
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(category)}
                  >
                    {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3 rounded-lg border p-3"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={() => handleTogglePermission(permission.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={permission.id}
                          className="cursor-pointer font-medium leading-none"
                        >
                          {permission.name}
                        </Label>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/roles")}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les permissions
        </Button>
      </div>
    </form>
  );
}

