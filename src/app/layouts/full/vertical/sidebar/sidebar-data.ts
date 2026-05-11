import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [

  {
    divider: true,
    navCap: 'Dashboards',

  },
  // Dashboard
  {
    displayName: 'Dashboard',
    iconName: 'solar:chart-square-line-duotone',
    route: '/dashboards/dashboard1',
    locked: false
  },
  // Sales
  {
    displayName: 'Sales',
    iconName: 'solar:wallet-money-line-duotone',
    route: '/sales',
    locked: false,

    children: [
      {
        displayName: 'Invoices',
        iconName: 'mdi:circle-small',
        route: '/sales/add-invoice',
        subItemIcon: true
      },
      {
        displayName: 'Credit Notes',
        iconName: 'mdi:circle-small',
        route: '/sales/credit-notes',
        subItemIcon: true
      },
      {
        displayName: 'E-Invoice',
        iconName: 'mdi:circle-small',
        route: '/sales/e-invoice',
        subItemIcon: true
      }
    ]
  },
  // Purchase
  {
    displayName: 'Purchase',
    iconName: 'solar:cart-line-duotone',
    route: '/purchase',
    locked: false,

    children: [
      {
        displayName: 'Add Purchase',
        iconName: 'mdi:circle-small',
        route: '/purchase/add-purchase',
        subItemIcon: true
      },
      {
        displayName: 'Debit Notes',
        iconName: 'mdi:circle-small',
        route: '/purchase/debit-notes',
        subItemIcon: true
      }
    ]
  },
  // Quatations
  {
    displayName: 'Quotations',
    iconName: 'solar:document-text-line-duotone',
    route: 'quotations',
    locked: true,
    children: [
      { displayName: 'Quotations', iconName: 'mdi:circle-small', subItemIcon: true, route: 'quotations/list' },
      { displayName: 'Sales Orders', iconName: 'mdi:circle-small', subItemIcon: true, route: 'quotations/sales-orders' },
      { displayName: 'Pro Forma Invoices', iconName: 'mdi:circle-small', subItemIcon: true, route: 'quotations/proforma' },
      { displayName: 'Delivery Challans', iconName: 'mdi:circle-small', subItemIcon: true, route: 'quotations/delivery' }
    ]
  },
  // E Way Bills
  {
    displayName: 'E-Way Bills',
    iconName: 'solar:delivery-line-duotone',
    route: 'eway-bills/eway-bills', // ✔️ IMPORTANT
    locked: false,
  },
  // Expenses
  {
    displayName: 'Expenses',
    iconName: 'solar:wallet-money-line-duotone',
    route: '/expenses/expenseslist',
    locked: false,

  },
  // Products
  {
    displayName: 'Products',
    iconName: 'solar:box-line-duotone',
    route: '/products/add-product',
    locked: false,
  },
  // Payments
  {
    displayName: 'Payments',
    iconName: 'solar:card-transfer-line-duotone',
    route: '/payments',
    locked: false,

    children: [
      { displayName: 'Timeline', iconName: 'mdi:circle-small', route: '/payments/timeline', subItemIcon: true },
      { displayName: 'Payment Links', iconName: 'mdi:circle-small', route: '/payments/payment-links', subItemIcon: true },
    ]
  },
  // Customers
  {
    displayName: 'Customers',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: 'customers/customers',
    locked: false,
  },
  // Vendors
  {
    displayName: 'Vendors',
    iconName: 'solar:shop-line-duotone',
    route: 'vendors/vendors',
    locked: false,
  },
  // Reports
  {
    displayName: 'Reports',
    iconName: 'solar:chart-square-line-duotone',
    route: '/reports',
    locked: true,

    children: [
      { displayName: 'Sales Reports', iconName: 'mdi:circle-small', route: '/reports/sales-reports', subItemIcon: true },
      { displayName: 'Purchase Reports', iconName: 'mdi:circle-small', route: '/reports/purchase-reports', subItemIcon: true },
    ],
  },
  // Settings
  {
    displayName: 'Settings',
    iconName: 'solar:settings-line-duotone',
    route: 'settings/settings',
    locked: false,
  }
];