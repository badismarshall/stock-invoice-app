"use client";

import { SelectTrigger } from "@radix-ui/react-select";
import type { Table } from "@tanstack/react-table";
import { CheckCircle2, Download, Shield, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/shared/data-table/data-table-action-bar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { exportTableToCSV } from "@/lib/data-table/export";
import { deleteUsers, assignRolesToUser, updateUser } from "../../_lib/actions";
import { getRoles } from "@/app/(root)/dashboard/roles/_lib/actions";
import type { UserDTOItem } from "@/data/user/user.dto";

const actions = [
  "update-role",
  "update-email-verified",
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface UsersTableActionBarProps {
  table: Table<UserDTOItem>;
  roles?: Array<{
    id: string;
    name: string;
    label: string;
    description: string | null;
    createdAt: Date;
    userCount: number;
  }>;
}

export function UsersTableActionBar({ table, roles = [] }: UsersTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);
  const [availableRoles, setAvailableRoles] = React.useState(roles);

  // Load roles if not provided
  React.useEffect(() => {
    if (roles.length === 0) {
      getRoles().then((result) => {
        if (result.data) {
          setAvailableRoles(result.data);
        }
      });
    }
  }, [roles]);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onRoleUpdate = React.useCallback(
    (roleId: string) => {
      setCurrentAction("update-role");
      startTransition(async () => {
        const roleIds = roleId ? [roleId] : [];
        const userIds = rows.map((row) => row.original.id);

        // Assign role to all selected users
        const results = await Promise.all(
          userIds.map((userId) =>
            assignRolesToUser({
              userId,
              roleIds,
            })
          )
        );

        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          toast.error(
            errors.length === 1
              ? errors[0].error || "Erreur lors de la mise à jour"
              : `${errors.length} erreurs lors de la mise à jour`
          );
          return;
        }

        toast.success(
          userIds.length === 1
            ? "Rôle mis à jour"
            : `${userIds.length} rôles mis à jour`
        );
        table.toggleAllRowsSelected(false);
      });
    },
    [rows, table],
  );

  const onEmailVerifiedUpdate = React.useCallback(
    (emailVerified: boolean) => {
      setCurrentAction("update-email-verified");
      startTransition(async () => {
        const userIds = rows.map((row) => row.original.id);

        // Update emailVerified for all selected users
        const results = await Promise.all(
          userIds.map((userId) =>
            updateUser({
              id: userId,
              emailVerified,
            })
          )
        );

        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          toast.error(
            errors.length === 1
              ? errors[0].error || "Erreur lors de la mise à jour"
              : `${errors.length} erreurs lors de la mise à jour`
          );
          return;
        }

        toast.success(
          userIds.length === 1
            ? "Utilisateur mis à jour"
            : `${userIds.length} utilisateurs mis à jour`
        );
        table.toggleAllRowsSelected(false);
      });
    },
    [rows, table],
  );

  const onUserExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  const onUserDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteUsers({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Users deleted");
      table.toggleAllRowsSelected(false);
    });
  }, [rows, table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <Select
          onValueChange={onRoleUpdate}
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Mettre à jour le rôle"
              isPending={getIsActionPending("update-role")}
            >
              <Shield />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="">Aucun</SelectItem>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value: string) =>
            onEmailVerifiedUpdate(value === "true")
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Mettre à jour la vérification email"
              isPending={getIsActionPending("update-email-verified")}
            >
              <CheckCircle2 />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="true">Vérifié</SelectItem>
              <SelectItem value="false">Non vérifié</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <DataTableActionBarAction
          size="icon"
          tooltip="Exporter les utilisateurs"
          isPending={getIsActionPending("export")}
          onClick={onUserExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Supprimer les utilisateurs"
          isPending={getIsActionPending("delete")}
          onClick={onUserDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}