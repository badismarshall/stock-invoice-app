import { Home, Settings, Package, Boxes, ShoppingCart, FileBarChart, Users, HandCoins, Truck, List, Plus, AlertTriangle } from "lucide-react"

export const adminSidebarItemsGeneralSetting = [
  {
    title: 'Tableau de bord',
    url: '/dashboard/',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Produits',
    icon: Package,
    isActive: false,
    items: [
      {
        title: 'Tous les produits',
        url: '/dashboard/products',
        icon: Package,
        isActive: true,
      },
      {
        title: 'Nouveau produit',
        url: '/dashboard/products/new',
        icon: Plus,
        isActive: false,
      },
      {
        title: 'Catégories',
        url: '/dashboard/products/category',
        icon: List,
        isActive: false,
      },
    ],
  },
  {
    title: 'Stock',
    icon: Boxes,
    isActive: false,
    items: [
      {
        title: 'Stock actuel',
        url: '/dashboard/stock/current',
        icon: Boxes,
        isActive: true,
      },
      {
        title: 'Vue d\'ensemble',
        url: '/dashboard/stock/overview',
        icon: Boxes,
        isActive: false,
      },
      {
        title: 'Mouvements de stock',
        url: '/dashboard/stock/movements',
        icon: List,
        isActive: false,
      },
      {
        title: 'Nouveau stock',
        url: '/dashboard/stock/new',
        icon: Plus,
        isActive: false,
      },
      {
        title: 'Alertes de stock',
        url: '/dashboard/stock/alerts',
        icon: AlertTriangle,
        isActive: false,
      },
    ],
  },
  {
    title: 'Vente',
    url: '/dashboard/sales',
    icon: ShoppingCart,
    isActive: false,
    items: [
      {
        title: 'Liste des ventes',
        url: '/dashboard/sales',
        icon: List,
        isActive: false,
      },
      {
        title: 'Nouvelle vente',
        url: '/dashboard/sales/new',
        icon: Plus,
        isActive: false,
      },
    ],
  },
  {
    title: 'Export',
    url: '/dashboard/export',
    icon: FileBarChart,
    isActive: false,
    items: [
      {
        title: 'Liste des bons de livraison',
        url: '/dashboard/export/delivery-notes',
        icon: List,
        isActive: false,
      },
      {
        title: 'Ajouter un bon de livraison',
        url: '/dashboard/export/delivery-note/new',
        icon: Plus,
        isActive: false,
      },
      {
        title: 'Liste des factures proforma',
        url: '/dashboard/export/proforma',
        icon: List,
        isActive: false,
      },
      {
        title: 'Ajouter une facture proforma',
        url: '/dashboard/export/proforma/new',
        icon: Plus,
        isActive: false,
      },
      {
        title: 'Liste des factures export',
        url: '/dashboard/export/invoices',
        icon: List,
        isActive: false,
      },
      {
        title: 'Ajouter une facture export',
        url: '/dashboard/export/invoice/new',
        icon: Plus,
        isActive: false,
      },
    ],
  },
  {
    title: 'Achats',
    icon: ShoppingCart,
    isActive: false,
    items: [
      {
        title: 'Liste des achats',
        url: '/dashboard/purchases',
        icon: List,
        isActive: true,
      },
      {
        title: 'Nouvel achat',
        url: '/dashboard/purchases/new',
        icon: Plus,
        isActive: false,
      },
    ],
  },
  {
    title: 'Recouvrement',
    url: '/dashboard/collection',
    icon: HandCoins,
    isActive: false,
  },
  {
    title: 'Clients',
    url: '/dashboard/clients-suppliers',
    icon: Users,
    isActive: false,
  },
  {
    title: 'Fournisseurs',
    url: '/dashboard/clients-suppliers/suppliers',
    icon: Truck,
    isActive: false,
  },
  {
    title: 'Utilisateurs',
    url: '/dashboard/users',
    icon: Users,
    isActive: false,
  },
  {
    title: 'Paramètre',
    url: '/dashboard/settings',
    icon: Settings,
    isActive: false,
  }
];

export const customerSidebarItemsGeneralSetting = [
  {
    title: 'Tableau de bord',
    url: '/dashboard/customer',
    icon: Home,
    isActive: true,
  }
];