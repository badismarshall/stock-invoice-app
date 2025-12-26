import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { getRoleById, getPermissions } from "../../_lib/actions";
import { RolePermissionsForm } from "./_components/role-permissions-form";

export const metadata: Metadata = {
  title: "Gérer les permissions",
  description: "Gérer les permissions d'un rôle",
};

interface RolePermissionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function RolePermissionsPage(props: RolePermissionsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  const params = await props.params;
  const [roleResult, permissionsResult] = await Promise.all([
    getRoleById(params.id),
    getPermissions(),
  ]);

  if (roleResult.error || !roleResult.data) {
    redirect("/dashboard/roles");
  }

  if (permissionsResult.error) {
    redirect("/dashboard/roles");
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Permissions pour {roleResult.data.label}
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez les permissions à attribuer à ce rôle
        </p>
      </div>
      <RolePermissionsForm
        role={roleResult.data}
        allPermissions={permissionsResult.data || []}
      />
    </div>
  );
}

