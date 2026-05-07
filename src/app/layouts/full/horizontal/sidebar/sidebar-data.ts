import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboards',
    iconName: 'solar:chart-line-duotone',
    route: 'dashboards',
    children: [
      {
        displayName: 'Dashboard 1',
        iconName: 'solar:stop-circle-line-duotone',
        route: 'dashboards/dashboard1',
      },
      {
        displayName: 'Dashboard 2',
        iconName: 'solar:stop-circle-line-duotone',
        route: 'dashboards/dashboard2',
      },
      {
        displayName: 'Dashboard 3',
        iconName: 'solar:stop-circle-line-duotone',
        route: 'dashboards/dashboard3',
      },
    ],
  },
  {
    displayName: 'Front Pages',
    iconName: 'solar:home-angle-line-duotone',
    route: 'front-pages',
    children: [
      {
        displayName: 'Homepage',
        iconName: 'solar:stop-circle-line-duotone',
        route: 'front-pages/homepage',
      },
      {
        displayName: 'About Us',
        iconName: 'solar:stop-circle-line-duotone',
        route: 'front-pages/about',
      },
    ],
  },
];
