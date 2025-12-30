# Pattern pour ajouter le Skeleton Loader aux tables

Ce document décrit le pattern à suivre pour ajouter le skeleton loader à toutes les tables de données de l'application.

## Hook réutilisable

Un hook `useTableLoading` a été créé dans `hooks/data-table/use-table-loading.ts` qui gère automatiquement la détection des changements de page/tri/filtres.

## Pattern à appliquer

Pour chaque table, suivez ces étapes :

### 1. Imports à ajouter

```typescript
import { useTableLoading } from "@/hooks/data-table/use-table-loading";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";
```

### 2. Utiliser le hook

```typescript
const { showLoading, startTransition, resetLoading } = useTableLoading();
```

### 3. Reset loading quand les données arrivent

```typescript
React.useEffect(() => {
  if (data) {
    resetLoading();
  }
}, [data, resetLoading]);
```

### 4. Passer startTransition à useDataTable

```typescript
const { table, shallow, debounceMs, throttleMs } = useDataTable({
  // ... autres props
  startTransition,
});
```

### 5. Afficher le skeleton pendant le chargement

```typescript
// Show skeleton during loading
if (showLoading) {
  return (
    <>
      <DataTableSkeleton
        columnCount={X} // Nombre de colonnes de la table
        filterCount={2} // Généralement 2
        cellWidths={[...]} // Largeurs des cellules (optionnel)
        shrinkZero
      />
      {/* Dialogs si nécessaire */}
    </>
  );
}
```

## Tables à mettre à jour

Voici la liste des tables avec leur configuration de skeleton :

- ✅ `export/delivery-notes` - 8 colonnes, 2 filtres
- ✅ `products` - 9 colonnes, 2 filtres
- ⏳ `purchases/purchase-orders` - 9 colonnes, 2 filtres
- ⏳ `invoices` - 10 colonnes, 2 filtres
- ⏳ `payments` - 10 colonnes, 2 filtres
- ⏳ `users` - 7 colonnes, 2 filtres
- ⏳ `clients-suppliers` - 5 colonnes, 2 filtres
- ⏳ `stock/current` - 9 colonnes, 2 filtres
- ⏳ `stock/movements` - 12 colonnes, 2 filtres
- ⏳ Et toutes les autres tables listées dans les pages...

## Exemple complet

Voir `app/(root)/dashboard/products/_components/data-table/products-table.tsx` pour un exemple complet.
