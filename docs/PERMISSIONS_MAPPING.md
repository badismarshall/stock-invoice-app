# Mapping des Permissions par Action

Ce document liste toutes les permissions nécessaires pour chaque action dans l'application.

## Achats (Purchases)

- **Lire les commandes d'achat**: `purchases.read`
- **Créer une commande d'achat**: `purchases.create`
- **Modifier une commande d'achat**: `purchases.update`
- **Supprimer une commande d'achat**: `purchases.delete`
- **Exporter les commandes d'achat**: `purchases.export`
- **Créer une facture depuis une commande**: `invoices.create`
- **Imprimer une facture d'achat**: `invoices.print`
- **Créer un paiement pour une facture d'achat**: `payments.create`
- **Gérer les paiements d'une facture d'achat**: `payments.read`

## Ventes (Sales)

- **Lire les ventes**: `sales.read`
- **Créer une vente**: `sales.create`
- **Modifier une vente**: `sales.update`
- **Supprimer une vente**: `sales.delete`
- **Exporter les ventes**: `sales.export`
- **Créer une facture depuis une vente**: `invoices.create`
- **Imprimer une facture de vente**: `invoices.print`
- **Créer un paiement pour une facture de vente**: `payments.create`
- **Gérer les paiements d'une facture de vente**: `payments.read`

## Export

- **Lire les factures export**: `invoices.read` (ou permissions spécifiques export)
- **Créer une facture proforma**: `invoices.create`
- **Créer un bon de livraison export**: `sales.create` (ou permissions spécifiques export)
- **Créer une facture export**: `invoices.create`
- **Modifier une facture export**: `invoices.update`
- **Supprimer une facture export**: `invoices.delete`
- **Imprimer une facture export**: `invoices.print`
- **Créer un paiement pour une facture export**: `payments.create`
- **Gérer les paiements d'une facture export**: `payments.read`

## Factures (Invoices)

- **Lire les factures**: `invoices.read`
- **Créer une facture**: `invoices.create`
- **Modifier une facture**: `invoices.update`
- **Supprimer une facture**: `invoices.delete`
- **Imprimer une facture**: `invoices.print`
- **Créer un paiement pour une facture**: `payments.create`
- **Gérer les paiements d'une facture**: `payments.read`

## Paiements (Payments)

- **Lire les paiements**: `payments.read`
- **Créer un paiement**: `payments.create`
- **Modifier un paiement**: `payments.update`
- **Supprimer un paiement**: `payments.delete`
- **Voir la facture associée**: `invoices.print` (ou `invoices.read`)

## Produits (Products)

- **Lire les produits**: `products.read`
- **Créer un produit**: `products.create`
- **Modifier un produit**: `products.update`
- **Supprimer un produit**: `products.delete`
- **Gérer les catégories**: `products.manage_categories`

## Stock

- **Lire le stock**: `stock.read`
- **Créer un mouvement de stock**: `stock.create_movement`
- **Modifier un mouvement de stock**: `stock.update_movement`
- **Supprimer un mouvement de stock**: `stock.delete_movement`
- **Gérer les alertes de stock**: `stock.manage_alerts`

## Utilisateurs (Users)

- **Lire les utilisateurs**: `settings.manage_users`
- **Créer un utilisateur**: `settings.manage_users`
- **Modifier un utilisateur**: `settings.manage_users`
- **Supprimer un utilisateur**: `settings.manage_users`
- **Assigner des rôles**: `settings.manage_users`

## Rôles & Permissions

- **Lire les rôles**: `settings.manage_roles`
- **Créer un rôle**: `settings.manage_roles`
- **Modifier un rôle**: `settings.manage_roles`
- **Supprimer un rôle**: `settings.manage_roles`
- **Gérer les permissions d'un rôle**: `settings.manage_roles`

## Paramètres

- **Gérer les informations de l'entreprise**: `settings.manage_company_settings`
- **Gérer les sauvegardes**: `settings.manage_backups`
- **Changer son mot de passe**: `settings.change_password`

