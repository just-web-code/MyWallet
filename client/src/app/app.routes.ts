import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/app-layout.component').then((m) => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard · MyWallet',
      },
      {
        path: 'wallets',
        loadComponent: () => import('./features/wallets/wallets.component').then((m) => m.WalletsComponent),
        title: 'Wallets · MyWallet',
      },
      {
        path: 'wallets/new',
        loadComponent: () => import('./features/wallets/wallet-form.component').then((m) => m.WalletFormComponent),
        title: 'New wallet · MyWallet',
      },
      {
        path: 'wallets/:id/edit',
        loadComponent: () => import('./features/wallets/wallet-form.component').then((m) => m.WalletFormComponent),
        title: 'Edit wallet · MyWallet',
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
        title: 'Categories · MyWallet',
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./features/categories/category-form.component').then((m) => m.CategoryFormComponent),
        title: 'New category · MyWallet',
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () => import('./features/categories/category-form.component').then((m) => m.CategoryFormComponent),
        title: 'Edit category · MyWallet',
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent),
        title: 'Transactions · MyWallet',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Settings · MyWallet',
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Profile · MyWallet',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign in · MyWallet',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
    title: 'Create account · MyWallet',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Reset password · MyWallet',
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Not found · MyWallet',
  },
];
