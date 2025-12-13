import { Home, Settings, Package, Boxes, ShoppingCart, FileBarChart, Users, HandCoins, Truck, List, Plus } from "lucide-react"

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
    url: '/dashboard/stock',
    icon: Boxes,
    isActive: false,
  },
  {
    title: 'Vente',
    url: '/dashboard/sales',
    icon: ShoppingCart,
    isActive: false,
  },
  {
    title: 'Export',
    url: '/dashboard/export',
    icon: FileBarChart,
    isActive: false,
  },
  {
    title: 'Achats',
    icon: ShoppingCart,
    isActive: false,
    items: [
      {
        title: 'Tous les bons de commande',
        url: '/dashboard/purchases',
        icon: List,
        isActive: true,
      },
      {
        title: 'Nouveau bon de commande',
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