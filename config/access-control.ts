/**
 * Access control configuration
 * Maps routes to required permissions
 */

export const routePermissions: Record<string, string[]> = {
  // Purchases
  "/dashboard/purchases": ["purchases.read"],
  "/dashboard/purchases/new": ["purchases.create"],
  "/dashboard/purchases/modify": ["purchases.update"],
  "/dashboard/purchases/export/pdf": ["purchases.export"],
  "/dashboard/purchases/export/xlsx": ["purchases.export"],
  
  // Sales
  "/dashboard/sales": ["sales.read"],
  "/dashboard/sales/new": ["sales.create"],
  "/dashboard/sales/modify": ["sales.update"],
  "/dashboard/sales/export/pdf": ["sales.export"],
  "/dashboard/sales/export/xlsx": ["sales.export"],
  
  // Export invoices
  "/dashboard/export/invoices": ["invoices.read"],
  "/dashboard/export/proforma": ["invoices.read"],
  
  // Invoices
  "/dashboard/invoices": ["invoices.read"],
  "/dashboard/invoices/new": ["invoices.create"],
  "/dashboard/invoices/modify": ["invoices.update"],
  
  // Products
  "/dashboard/products": ["products.read"],
  "/dashboard/products/new": ["products.create"],
  "/dashboard/products/modify": ["products.update"],
  
  // Stock
  "/dashboard/stock": ["stock.read"],
  "/dashboard/stock/new": ["stock.create"],
  "/dashboard/stock/movements": ["stock.read"],
  
  // Payments
  "/dashboard/payments": ["payments.read"],
  "/dashboard/payments/add": ["payments.create"],
  "/dashboard/payments/modify": ["payments.update"],
  
  // Clients & Suppliers
  "/dashboard/clients-suppliers": ["partners.read"],
  "/dashboard/clients-suppliers/suppliers": ["partners.read"],
  
  // Users
  "/dashboard/users": ["settings.manage_users"],
  
  // Settings
  "/dashboard/settings/backup": ["settings.manage_backup"],
  "/dashboard/settings/company-settings": ["settings.manage_company"],
  
  // Roles & Permissions
  "/dashboard/roles": ["settings.manage_roles"],
};

/**
 * Get required permissions for a route
 * @param pathname - The route pathname
 * @returns Array of required permissions, or empty array if no specific permissions required
 */
export function getRequiredPermissions(pathname: string): string[] {
  // Exact match first
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }
  
  // Check for prefix matches (e.g., /dashboard/purchases/modify/123)
  for (const [route, permissions] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route + "/") || pathname === route) {
      return permissions;
    }
  }
  
  return [];
}

/**
 * Check if a route requires authentication
 * All dashboard routes require authentication
 */
export function requiresAuth(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

