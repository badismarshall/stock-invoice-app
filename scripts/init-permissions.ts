/**
 * Script to initialize base permissions in the database
 * Run this script once to populate the permission_definitions table
 */

import db from "@/db";
import { permissionDefinition } from "@/db/schema";
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

async function initPermissions() {
  try {
    console.log("Initializing base permissions...");
    
    for (const perm of basePermissions) {
      // Check if permission already exists
      const existing = await db
        .select()
        .from(permissionDefinition)
        .where(eq(permissionDefinition.name, perm.name))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(permissionDefinition).values({
          id: generateId(),
          name: perm.name,
          description: perm.description,
          category: perm.category,
        });
        console.log(`✓ Created permission: ${perm.name}`);
      } else {
        console.log(`- Permission already exists: ${perm.name}`);
      }
    }
    
    console.log("✓ Permissions initialization complete!");
  } catch (error) {
    console.error("Error initializing permissions:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initPermissions()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

export { initPermissions };

