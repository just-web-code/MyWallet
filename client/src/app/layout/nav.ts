export interface NavItem {
  /** PrimeIcons class, e.g. 'pi pi-wallet'. */
  icon: string;
  /** i18n key resolved with ngx-translate. */
  labelKey: string;
  path: string;
  /** Exact route match (used for '/'). */
  exact?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { icon: 'pi pi-th-large', labelKey: 'nav.dashboard', path: '/', exact: true },
  { icon: 'pi pi-wallet', labelKey: 'nav.wallets', path: '/wallets' },
  { icon: 'pi pi-arrow-right-arrow-left', labelKey: 'nav.transactions', path: '/transactions' },
  { icon: 'pi pi-tags', labelKey: 'nav.categories', path: '/categories' },
];

export const SECONDARY_NAV: NavItem[] = [
  { icon: 'pi pi-cog', labelKey: 'nav.settings', path: '/settings' },
];
