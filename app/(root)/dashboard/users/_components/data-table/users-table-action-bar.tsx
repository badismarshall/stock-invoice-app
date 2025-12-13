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
import { deleteUsers, updateUsers } from "../../_lib/actions";
import type { UserDTOItem } from "@/data/user/user.dto";

const actions = [
  "update-role",
  "update-email-verified",
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

// Common user roles - adjust based on your application needs
const userRoles = ["admin", "user", "moderator"] as const;

interface UsersTableActionBarProps {
  table: Table<UserDTOItem>;
}

export function UsersTableActionBar({ table }: UsersTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onUserUpdate = React.useCallback(
    ({
      field,
      value,
    }: {
      field: "role" | "emailVerified";
      value: UserDTOItem["role"] | UserDTOItem["emailVerified"];
    }) => {
      setCurrentAction(
        field === "role" ? "update-role" : "update-email-verified",
      );
      startTransition(async () => {
        const updateData: Parameters<typeof updateUsers>[0] = {
          ids: rows.map((row) => row.original.id),
        };

        if (field === "role") {
          updateData.role = value as UserDTOItem["role"];
        } else if (field === "emailVerified") {
          updateData.emailVerified = value as UserDTOItem["emailVerified"];
        }

        const { error } = await updateUsers(updateData);

        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Users updated");
      });
    },
    [rows],
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
        onValueChange={(value: UserDTOItem["role"]) =>
            onUserUpdate({ field: "role", value: value })
        }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Update role"
              isPending={getIsActionPending("update-role")}
            >
              <Shield />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {userRoles.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value: string) =>
            onUserUpdate({ field: "emailVerified", value: value === "true" ? true : false })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Update email verified"
              isPending={getIsActionPending("update-email-verified")}
            >
              <CheckCircle2 />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <DataTableActionBarAction
          size="icon"
          tooltip="Export users"
          isPending={getIsActionPending("export")}
          onClick={onUserExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Delete users"
          isPending={getIsActionPending("delete")}
          onClick={onUserDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}