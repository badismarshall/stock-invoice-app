/**
 * Script to initialize admin role with all permissions
 * This script:
 * 1. Creates all base permissions if they don't exist
 * 2. Creates an admin role
 * 3. Assigns all permissions to the admin role
 * 4. Optionally assigns the admin role to a specific user
 * 
 * Usage: tsx scripts/init-admin-role.ts [userId]
 */

import db from "@/db";
import { role, permissionDefinition, rolePermission, userRole } from "@/db/schema";
import { generateId } from "@/lib/data-table/id";
import { eq } from "drizzle-orm";

const basePermissions = [
  // Purchases
  { name: "purchases.read", description: "Lire les commandes d'achat", category: "Achats" },
  { name: "purchases.create", description: "Créer des commandes d'achat", category: "Achats" },
  { name: "purchases.update", description: "Modifier les commandes d'achat", category: "Achats" },
  { name: "purchases.delete", description: "Supprimer les commandes d'achat", category: "Achats" },
  { name: "purchases.export", description: "Exporter les commandes d'achat", category: "Achats" },
  
  // Sales
  { name: "sales.read", description: "Lire les ventes", category: "Ventes" },
  { name: "sales.create", description: "Créer des ventes", category: "Ventes" },
  { name: "sales.update", description: "Modifier les ventes", category: "Ventes" },
  { name: "sales.delete", description: "Supprimer les ventes", category: "Ventes" },
  { name: "sales.export", description: "Exporter les ventes", category: "Ventes" },
  
  // Invoices
  { name: "invoices.read", description: "Lire les factures", category: "Factures" },
  { name: "invoices.create", description: "Créer des factures", category: "Factures" },
  { name: "invoices.update", description: "Modifier les factures", category: "Factures" },
  { name: "invoices.delete", description: "Supprimer les factures", category: "Factures" },
  
  // Products
  { name: "products.read", description: "Lire les produits", category: "Produits" },
  { name: "products.create", description: "Créer des produits", category: "Produits" },
  { name: "products.update", description: "Modifier les produits", category: "Produits" },
  { name: "products.delete", description: "Supprimer les produits", category: "Produits" },
  
  // Stock
  { name: "stock.read", description: "Lire le stock", category: "Stock" },
  { name: "stock.create", description: "Créer des mouvements de stock", category: "Stock" },
  { name: "stock.update", description: "Modifier le stock", category: "Stock" },
  
  // Payments
  { name: "payments.read", description: "Lire les paiements", category: "Paiements" },
  { name: "payments.create", description: "Créer des paiements", category: "Paiements" },
  { name: "payments.update", description: "Modifier les paiements", category: "Paiements" },
  { name: "payments.delete", description: "Supprimer les paiements", category: "Paiements" },
  
  // Partners
  { name: "partners.read", description: "Lire les clients et fournisseurs", category: "Partenaires" },
  { name: "partners.create", description: "Créer des clients et fournisseurs", category: "Partenaires" },
  { name: "partners.update", description: "Modifier les clients et fournisseurs", category: "Partenaires" },
  { name: "partners.delete", description: "Supprimer les clients et fournisseurs", category: "Partenaires" },
  
  // Settings
  { name: "settings.manage_users", description: "Gérer les utilisateurs", category: "Paramètres" },
  { name: "settings.manage_roles", description: "Gérer les rôles et permissions", category: "Paramètres" },
  { name: "settings.manage_company", description: "Gérer les paramètres de l'entreprise", category: "Paramètres" },
  { name: "settings.manage_backup", description: "Gérer les backups", category: "Paramètres" },
];

async function initAdminRole(userId?: string) {
  try {
    console.log("🚀 Initializing admin role and permissions...\n");

    // Step 1: Create all permissions
    console.log("📝 Step 1: Creating base permissions...");
    const permissionIds: string[] = [];
    
    for (const perm of basePermissions) {
      // Check if permission already exists
      const existing = await db
        .select()
        .from(permissionDefinition)
        .where(eq(permissionDefinition.name, perm.name))
        .limit(1);
      
      if (existing.length === 0) {
        const id = generateId();
        await db.insert(permissionDefinition).values({
          id,
          name: perm.name,
          description: perm.description,
          category: perm.category,
        });
        permissionIds.push(id);
        console.log(`  ✓ Created permission: ${perm.name}`);
      } else {
        permissionIds.push(existing[0].id);
        console.log(`  - Permission already exists: ${perm.name}`);
      }
    }

    // Step 2: Create admin role if it doesn't exist
    console.log("\n👑 Step 2: Creating admin role...");
    let adminRoleId: string;
    
    const existingRole = await db
      .select()
      .from(role)
      .where(eq(role.name, "admin"))
      .limit(1);
    
    if (existingRole.length === 0) {
      adminRoleId = generateId();
      await db.insert(role).values({
        id: adminRoleId,
        name: "admin",
        label: "Administrateur",
        description: "Rôle administrateur avec toutes les permissions",
      });
      console.log(`  ✓ Created admin role`);
    } else {
      adminRoleId = existingRole[0].id;
      console.log(`  - Admin role already exists`);
    }

    // Step 3: Assign all permissions to admin role
    console.log("\n🔗 Step 3: Assigning permissions to admin role...");
    
    // Delete existing role permissions
    await db.delete(rolePermission).where(eq(rolePermission.roleId, adminRoleId));
    console.log(`  - Cleared existing permissions`);
    
    // Insert all permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) => ({
        id: generateId(),
        roleId: adminRoleId,
        permissionId,
      }));

      await db.insert(rolePermission).values(rolePermissions);
      console.log(`  ✓ Assigned ${permissionIds.length} permissions to admin role`);
    }

    // Step 4: Assign admin role to user if userId provided
    if (userId) {
      console.log(`\n👤 Step 4: Assigning admin role to user ${userId}...`);
      
      // Check if user already has admin role
      const existingUserRole = await db
        .select()
        .from(userRole)
        .where(eq(userRole.userId, userId))
        .where(eq(userRole.roleId, adminRoleId))
        .limit(1);
      
      if (existingUserRole.length === 0) {
        // Remove any existing roles for this user (optional - comment out if you want to keep multiple roles)
        // await db.delete(userRole).where(eq(userRole.userId, userId));
        
        await db.insert(userRole).values({
          id: generateId(),
          userId,
          roleId: adminRoleId,
        });
        console.log(`  ✓ Assigned admin role to user`);
      } else {
        console.log(`  - User already has admin role`);
      }
    } else {
      console.log(`\n👤 Step 4: Skipped (no userId provided)`);
      console.log(`  💡 To assign admin role to a user, run:`);
      console.log(`     tsx scripts/init-admin-role.ts <userId>`);
    }

    console.log("\n✅ Admin role initialization complete!");
    console.log(`\n📋 Summary:`);
    console.log(`   - Permissions: ${permissionIds.length}`);
    console.log(`   - Admin role ID: ${adminRoleId}`);
    if (userId) {
      console.log(`   - Assigned to user: ${userId}`);
    }
    
    return { adminRoleId, permissionCount: permissionIds.length };
  } catch (error) {
    console.error("\n❌ Error initializing admin role:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const userId = process.argv[2];
  
  initAdminRole(userId)
    .then(() => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Failed:", error);
      process.exit(1);
    });
}

export { initAdminRole };

