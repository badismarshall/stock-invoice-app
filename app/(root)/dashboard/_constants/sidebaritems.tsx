import { Home, Settings, Package, Boxes, ShoppingCart, FileBarChart, Users, HandCoins, Truck, List, Plus, AlertTriangle, Wallet, Lock, Database } from "lucide-react"

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
      {
        title: 'Liste des annulations de bons de livraison',
        url: '/dashboard/delivery-notes-cancellation',
        icon: List,
        isActive: false,
      },
      {
        title: 'Ajouter une annulation de bon de livraison',
        url: '/dashboard/delivery-notes-cancellation/new',
        icon: Plus,
        isActive: false,
      },
      {
        title: 'Liste des bons de livraison',
        url: '/dashboard/sales/delivery_notes',
        icon: List,
        isActive: false,
      },
      {
        title: 'Liste des factures de vente',
        url: '/dashboard/sales/sale_invoice',
        icon: List,
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
      {
        title: 'Liste des factures d\'achat',
        url: '/dashboard/purchases/purchase_invoice',
        icon: List,
        isActive: false,
      },
    ],
  },
  {
    title: 'Facturation',
    url: '/dashboard/invoices',
    icon: FileBarChart,
    isActive: false,
    items: [
      {
        title: 'Liste des factures',
        url: '/dashboard/invoices',
        icon: List,
        isActive: false,
      },
      {
        title: 'Nouvelle facture',
        url: '/dashboard/invoices/new',
        icon: Plus,
        isActive: false,
      },
    ],
  },
  {
    title: 'Paiements',
    url: '/dashboard/payments',
    icon: Wallet,
    isActive: false,
  },
  // {
  //   title: 'Recouvrement',
  //   url: '/dashboard/collection',
  //   icon: HandCoins,
  //   isActive: false,
  // },
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
    title: 'Paramètres',
    icon: Settings,
    isActive: false,
    items: [
      {
        title: 'Informations de l\'entreprise',
        url: '/dashboard/settings/company-settings',
        icon: Settings,
        isActive: false,
      },
      {
        title: 'Changer le mot de passe',
        url: '/dashboard/settings/change-password',
        icon: Lock,
        isActive: false,
      },
      {
        title: 'Backup',
        url: '/dashboard/settings/backup',
        icon: Database,
        isActive: false,
      },
    ],
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