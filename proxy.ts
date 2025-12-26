import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getRequiredPermissions, requiresAuth } from "@/config/access-control";
import { getUserPermissions } from "@/data/auth/roles.dal";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If no session, redirect to sign-in
    if (!session) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Get required permissions for this route
    const requiredPermissions = getRequiredPermissions(pathname);

    // If no specific permissions required, allow access
    if (requiredPermissions.length === 0) {
      return NextResponse.next();
    }

    // Get user permissions
    const permissionsResult = await getUserPermissions(session.user.id);
    const userPermissions: string[] = permissionsResult.data || [];

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      // User doesn't have required permission, redirect to 403 or dashboard
      const forbiddenUrl = new URL("/dashboard/forbidden", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware", error);
    // On error, redirect to sign-in for safety
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

