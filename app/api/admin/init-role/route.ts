import { NextResponse } from "next/server";
import { initAdminRole } from "@/scripts/init-admin-role";
import { getCurrentUser } from "@/data/user/user-auth";

/**
 * API route to initialize admin role with all permissions
 * POST /api/admin/init-role
 * Body: { userId?: string }
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = body.userId || currentUser.id;

    const result = await initAdminRole(userId);

    return NextResponse.json({
      success: true,
      message: "Rôle admin initialisé avec succès",
      data: result,
    });
  } catch (error) {
    console.error("Error initializing admin role:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'initialisation du rôle admin",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

