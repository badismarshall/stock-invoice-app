import { Home, Settings, Package, Boxes, ShoppingCart, FileBarChart, Users, HandCoins, Truck } from "lucide-react"

export const adminSidebarItemsGeneralSetting = [
  {
    title: 'Tableau de bord',
    url: '/dashboard/',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Produits',
    url: '/dashboard/products',
    icon: Package,
    isActive: false,
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
    url: '/dashboard/purchases',
    icon: ShoppingCart,
    isActive: false,
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