# Plan : Ajout des Statistiques "État de Vente Local" et "État de Vente Export"

## Vue d'ensemble

Ce plan décrit l'implémentation de pages de statistiques détaillées pour les modules de vente locale et vente export, permettant aux utilisateurs de visualiser l'état de leurs ventes avec des métriques clés, graphiques et tableaux récapitulatifs.

## 1. Structure des données et schémas

### 1.1 Données sources
- **Vente Local** :
  - `delivery_note` avec `note_type = 'local'`
  - `invoice` avec `invoice_type = 'sale_local'`
  - `delivery_note_item` pour les détails des produits
  
- **Vente Export** :
  - `delivery_note` avec `note_type = 'export'`
  - `invoice` avec `invoice_type = 'sale_export'` ou `'proforma'`
  - `delivery_note_item` pour les détails des produits

### 1.2 Métriques à calculer
- **Totaux généraux** :
  - Nombre total de bons de livraison
  - Nombre total de factures
  - Chiffre d'affaires total (HT, TVA, TTC)
  - Montant payé / non payé
  - Montant partiellement payé

- **Par période** (jour, semaine, mois, année) :
  - Évolution du CA
  - Nombre de transactions
  - Moyenne par transaction

- **Par client** :
  - Top clients par CA
  - Nombre de transactions par client
  - Montant moyen par client

- **Par produit** :
  - Top produits vendus (quantité)
  - Top produits par CA
  - Quantités totales vendues

- **Par devise** (pour export) :
  - Répartition par devise (DZD, EUR, USD, GBP)
  - CA par devise

## 2. Actions serveur (Server Actions)

### 2.1 Module Sales (Vente Local)
**Fichier** : `app/(root)/dashboard/sales/_lib/stats-actions.ts`

Fonctions à créer :
- `getLocalSalesStats(input: { startDate?: Date, endDate?: Date })`
  - Retourne les statistiques globales pour la période
  - Inclut : totaux, évolution, répartition par statut
  
- `getLocalSalesStatsByClient(input: { startDate?: Date, endDate?: Date, limit?: number })`
  - Retourne le top des clients par CA
  
- `getLocalSalesStatsByProduct(input: { startDate?: Date, endDate?: Date, limit?: number })`
  - Retourne le top des produits vendus
  
- `getLocalSalesStatsByPeriod(input: { period: 'day' | 'week' | 'month' | 'year', startDate?: Date, endDate?: Date })`
  - Retourne l'évolution du CA par période

### 2.2 Module Export (Vente Export)
**Fichier** : `app/(root)/dashboard/export/_lib/stats-actions.ts`

Fonctions similaires mais pour les ventes export :
- `getExportSalesStats(input: { startDate?: Date, endDate?: Date })`
- `getExportSalesStatsByClient(...)`
- `getExportSalesStatsByProduct(...)`
- `getExportSalesStatsByPeriod(...)`
- `getExportSalesStatsByCurrency(input: { startDate?: Date, endDate?: Date })`
  - Répartition du CA par devise

## 3. Pages de statistiques

### 3.1 Page Vente Local
**Fichier** : `app/(root)/dashboard/sales/stats/page.tsx`

Structure :
- Header avec titre "État de Vente Local"
- Filtres de période (date de début, date de fin)
- Section de cartes récapitulatives (CA total, nombre de BL, factures, etc.)
- Graphiques (évolution temporelle, répartition par client/produit)
- Tableaux détaillés (top clients, top produits)

### 3.2 Page Vente Export
**Fichier** : `app/(root)/dashboard/export/stats/page.tsx`

Structure similaire mais adaptée pour export :
- Header avec titre "État de Vente Export"
- Filtres de période
- Section de cartes récapitulatives
- Graphiques incluant la répartition par devise
- Tableaux détaillés

## 4. Composants UI

### 4.1 Composants réutilisables
**Dossier** : `app/(root)/dashboard/sales/stats/_components/` et `app/(root)/dashboard/export/stats/_components/`

- `stats-cards.tsx` : Cartes récapitulatives (CA, nombre de transactions, etc.)
- `stats-chart.tsx` : Graphique d'évolution temporelle (utiliser recharts)
- `stats-table.tsx` : Tableau des top clients/produits
- `stats-filters.tsx` : Filtres de période (date picker)
- `currency-breakdown.tsx` : Répartition par devise (pour export uniquement)

### 4.2 Bibliothèque de graphiques
Utiliser `recharts` (déjà présent dans package.json) pour :
- Graphiques en ligne (évolution temporelle)
- Graphiques en barres (top clients/produits)
- Graphiques en camembert (répartition par devise)

## 5. Intégration dans la navigation

### 5.1 Sidebar
**Fichier** : `app/(root)/dashboard/_constants/sidebaritems.tsx`

Ajouter :
- Sous "Ventes Locales" : "État de Vente Local" → `/dashboard/sales/stats`
- Sous "Ventes Export" : "État de Vente Export" → `/dashboard/export/stats`

### 5.2 Pages principales
Ajouter des boutons/liens vers les pages de statistiques dans :
- `app/(root)/dashboard/sales/page.tsx`
- `app/(root)/dashboard/export/page.tsx`

## 6. Requêtes SQL optimisées

### 6.1 Agrégations
Utiliser des requêtes SQL optimisées avec :
- `SUM()`, `COUNT()`, `AVG()` pour les agrégations
- `GROUP BY` pour les regroupements (client, produit, période)
- `ORDER BY` pour les classements (top clients/produits)
- Index sur `note_date`, `invoice_date`, `note_type`, `invoice_type` pour performance

### 6.2 Filtres de date
- Utiliser des index sur les colonnes de date
- Implémenter des filtres efficaces avec `gte()` et `lte()` de Drizzle ORM

## 7. Exemple de structure de données retournée

```typescript
interface SalesStats {
  summary: {
    totalDeliveryNotes: number;
    totalInvoices: number;
    totalAmountHT: number;
    totalTaxAmount: number;
    totalAmountTTC: number;
    paidAmount: number;
    unpaidAmount: number;
    partiallyPaidAmount: number;
    growth: number; // % de croissance vs période précédente
  };
  byClient: Array<{
    clientId: string;
    clientName: string;
    transactionCount: number;
    totalAmount: number;
  }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    productCode: string;
    totalQuantity: number;
    totalAmount: number;
  }>;
  byPeriod: Array<{
    period: string; // "2024-01", "2024-02", etc.
    totalAmount: number;
    transactionCount: number;
  }>;
  // Pour export uniquement
  byCurrency?: Array<{
    currency: string;
    totalAmount: number;
    transactionCount: number;
  }>;
}
```

## 8. Ordre d'implémentation recommandé

1. **Phase 1** : Actions serveur
   - Créer `stats-actions.ts` pour sales
   - Créer `stats-actions.ts` pour export
   - Tester les requêtes SQL

2. **Phase 2** : Composants UI de base
   - Créer les composants de cartes récapitulatives
   - Créer les composants de filtres de date
   - Créer les composants de tableaux

3. **Phase 3** : Graphiques
   - Intégrer recharts
   - Créer les graphiques d'évolution
   - Créer les graphiques de répartition

4. **Phase 4** : Pages complètes
   - Créer la page stats pour sales
   - Créer la page stats pour export
   - Ajouter les liens dans la navigation

5. **Phase 5** : Optimisations
   - Optimiser les requêtes SQL
   - Ajouter la mise en cache si nécessaire
   - Améliorer les performances

## 9. Considérations techniques

### 9.1 Performance
- Utiliser des requêtes SQL optimisées avec agrégations
- Limiter le nombre de résultats pour les top clients/produits
- Implémenter la pagination si nécessaire

### 9.2 Responsive Design
- Les graphiques doivent être responsives
- Les tableaux doivent être scrollables sur mobile
- Utiliser les composants shadcn/ui existants

### 9.3 Internationalisation
- Tous les textes en français
- Format des dates selon locale fr
- Format des montants avec devise appropriée

## 10. Tests et validation

- Tester avec différentes périodes (jour, semaine, mois, année)
- Tester avec des données vides
- Tester avec de grandes quantités de données
- Vérifier les calculs de totaux
- Vérifier les filtres de date

