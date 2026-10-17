import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [

  // INICIAR SESIÓN
  {
    path: 'login',
    title: 'Iniciar sesión · Droguería Pili',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login)
  },

  // DASHBOARD: ADMIN Y CLIENTE
  {
    path: 'dashboard',
    title: 'Dashboard · Droguería Pili',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'cliente'] },
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(m => m.Dashboard)
  },

  // INVENTARIO: SOLO ADMIN
  {
    path: 'inventory',
    title: 'Inventario · Droguería Pili',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./pages/inventory/inventory').then(m => m.Inventory)
  },

  // VENTAS: SOLO ADMIN
  {
    path: 'sales',
    title: 'Ventas · Droguería Pili',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./pages/sales/sales').then(m => m.SalesComponent)
  },

  // COMPRAS: ADMIN Y CLIENTE
  {
    path: 'purchases',
    title: 'Compras · Droguería Pili',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'cliente'] },
    loadComponent: () =>
      import('./pages/purchases/purchases').then(m => m.Purchases)
  },

  // INFORMES: SOLO ADMIN
  {
    path: 'reports',
    title: 'Informes · Droguería Pili',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./pages/reports/reports').then(m => m.ReportsComponents)
  },

  // REGISTRO
  {
    path: 'register',
    title: 'Registro · Droguería Pili',
    loadComponent: () =>
      import('./pages/register/register').then(m => m.RegisterComponent)
  },

  // HISTORIAL DE COMPRAS: ADMIN Y CLIENTE
  {
    path: 'purchase-history',
    title: 'Historial de compras · Droguería Pili',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'cliente'] },
    loadComponent: () =>
      import('./pages/purchase-history/purchase-history')
        .then(m => m.PurchaseHistory)
  },

  // RUTA INICIAL
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  // RUTAS NO ENCONTRADAS
  {
    path: '**',
    redirectTo: 'login'
  }
];
