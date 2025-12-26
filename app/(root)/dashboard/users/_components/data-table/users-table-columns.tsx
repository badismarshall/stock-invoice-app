"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  CheckCircle2,
  CircleIcon,
  CircleX,
  Ellipsis,
  Mail,
  Shield,
  Text,
  UserX,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/data-table/format";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/types/data-table";
import type { UserDTOItem } from "@/data/user/user.dto";

import {
  getBannedStatusIcon,
  getEmailVerifiedIcon,
  getRoleIcon,
} from "../../_lib/utils";
import { assignRolesToUser } from "../../_lib/actions";
import { useRouter } from "next/navigation";

interface GetUsersTableColumnsProps {
  roleCounts: Record<string, number>;
  bannedCounts: { banned: number; active: number };
  emailVerifiedCounts: { verified: number; unverified: number };
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<UserDTOItem> | null>
  >;
  roles: Array<{
    id: string;
    name: string;
    label: string;
    description: string | null;
    createdAt: Date;
    userCount: number;
  }>;
  usersRoles: Record<string, Array<{
    id: string;
    name: string;
    label: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  }>>;
}

// French translations (feel free to adjust wording as needed)
const translations = {
  name: "Nom",
  searchNames: "Chercher des noms...",
  email: "E-mail",
  searchEmails: "Chercher des e-mails...",
  emailVerified: "E-mail vérifié",
  verified: "Vérifié",
  unverified: "Non vérifié",
  role: "Rôle",
  none: "Aucun",
  status: "Statut",
  active: "Actif",
  banned: "Banni",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  updating: "Mise à jour...",
  roleUpdated: "Rôle mis à jour",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
};

export function getUsersTableColumns({
  roleCounts,
  bannedCounts,
  emailVerifiedCounts,
  setRowAction,
  roles,
  usersRoles,
}: GetUsersTableColumnsProps): ColumnDef<UserDTOItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={translations.selectAll}
          className="translate-y-0.5"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={translations.selectRow}
          className="translate-y-0.5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.name} title={translations.name} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("name")}
          </span>
        );
      },
      meta: {
        label: translations.name,
        placeholder: translations.searchNames,
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.email} title={translations.email} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate">
            {row.getValue("email")}
          </span>
        );
      },
      meta: {
        label: translations.email,
        placeholder: translations.searchEmails,
        variant: "text",
        icon: Mail,
      },
      enableColumnFilter: true,
    },
    {
      id: "emailVerified",
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.emailVerified} title={translations.emailVerified} />
      ),
      cell: ({ cell }) => {
        const emailVerified = cell.getValue<boolean>();
        const Icon = getEmailVerifiedIcon(emailVerified);

        return (
          <Badge variant="outline" className="py-1 [&>svg]:size-3.5">
            <Icon />
            <span>{emailVerified ? translations.verified : translations.unverified}</span>
          </Badge>
        );
      },
      meta: {
        label: translations.emailVerified,
        variant: "multiSelect",
        options: [
          {
            label: translations.verified,
            value: "true",
            count: emailVerifiedCounts.verified,
            icon: CheckCircle2,
          },
          {
            label: translations.unverified,
            value: "false",
            count: emailVerifiedCounts.unverified,
            icon: CircleX,
          },
        ],
        icon: CheckCircle2,
      },
      enableColumnFilter: true,
    },
    {
      id: "role",
      accessorFn: () => "", // We don't use the accessor, we use usersRoles prop
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.role} title={translations.role} />
      ),
      cell: function Cell({ row }) {
        // Get user roles from the pre-loaded usersRoles map
        const userRoles = usersRoles[row.original.id] || [];

        if (userRoles.length === 0) {
          return (
            <Badge variant="outline" className="py-1">
              <CircleIcon className="size-3.5" />
              <span>{translations.none}</span>
            </Badge>
          );
        }

        // Get the first role (for now, we show only one role)
        const roleData = userRoles[0];
        if (!roleData) {
          return (
            <Badge variant="outline" className="py-1">
              <CircleIcon className="size-3.5" />
              <span>{translations.none}</span>
            </Badge>
          );
        }

        return (
          <Badge variant="outline" className="py-1 [&>svg]:size-3.5">
            <Shield className="size-3.5" />
            <span>{roleData.label}</span>
          </Badge>
        );
      },
      meta: {
        label: translations.role,
        variant: "multiSelect",
        options: [
          {
            label: translations.none,
            value: "",
            count: 0,
            icon: CircleIcon,
          },
          ...roles.map((role: { id: string; label: string; userCount: number }) => ({
            label: role.label,
            value: role.id,
            count: role.userCount || 0,
            icon: Shield,
          })),
        ],
        icon: Shield,
      },
      enableColumnFilter: true,
    },
    {
      id: "banned",
      accessorKey: "banned",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.status} title={translations.status} />
      ),
      cell: ({ cell }) => {
        const banned = cell.getValue<boolean>();
        const Icon = getBannedStatusIcon(banned);

        return (
          <Badge variant="outline" className="py-1 [&>svg]:size-3.5">
            <Icon />
            <span>{banned ? translations.banned : translations.active}</span>
          </Badge>
        );
      },
      meta: {
        label: translations.status,
        variant: "multiSelect",
        options: [
          {
            label: translations.active,
            value: "false",
            count: bannedCounts.active,
            icon: CheckCircle2,
          },
          {
            label: translations.banned,
            value: "true",
            count: bannedCounts.banned,
            icon: UserX,
          },
        ],
        icon: UserX,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.createdAt} title={translations.createdAt} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
      meta: {
        label: translations.createdAt,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const router = useRouter();
        const [isUpdatePending, setIsUpdatePending] = React.useState(false);
        
        // Get user roles from the pre-loaded usersRoles map
        const userRoles = usersRoles[row.original.id] || [];
        const userRoleIds = userRoles.map((r) => r.id);

        const handleRoleChange = async (roleId: string) => {
          setIsUpdatePending(true);
          try {
            const roleIds = roleId ? [roleId] : [];
            await toast.promise(
              assignRolesToUser({
                userId: row.original.id,
                roleIds,
              }),
              {
                loading: translations.updating,
                success: translations.roleUpdated,
                error: (err) => getErrorMessage(err),
              },
            );
            // Refresh the page to update the table
            router.refresh();
          } catch (error) {
            console.error("Error updating user roles", error);
          } finally {
            setIsUpdatePending(false);
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Ouvrir le menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{translations.role}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={userRoleIds[0] || ""}
                    onValueChange={handleRoleChange}
                  >
                    <DropdownMenuRadioItem
                      value=""
                      className="capitalize"
                      disabled={isUpdatePending}
                    >
                      {translations.none}
                    </DropdownMenuRadioItem>
                    {roles.map((role: { id: string; label: string }) => (
                      <DropdownMenuRadioItem
                        key={role.id}
                        value={role.id}
                        className="capitalize"
                        disabled={isUpdatePending}
                      >
                        {role.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                {translations.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
