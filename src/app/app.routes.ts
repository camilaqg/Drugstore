import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Inventory } from './pages/inventory/inventory';
import { SalesComponent } from './pages/sales/sales';
import { Purchases } from './pages/purchases/purchases';
import { ReportsComponents } from './pages/reports/reports';
import { RegisterComponent } from './pages/register/register';
import { PurchaseHistory } from './pages/purchase-history/purchase-history';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  {
    path: 'inventory',
    component: Inventory,
    canActivate: [authGuard]
  },

  {
    path: 'sales',
    component: SalesComponent,
    canActivate: [authGuard]
  },

  {
    path: 'purchases',
    component: Purchases,
    canActivate: [authGuard]
  },

  {
    path: 'reports',
    component: ReportsComponents,
    canActivate: [authGuard]
  },

  {
    path: 'register',
    component: RegisterComponent
  },

  {
    path: 'purchase-history',
    component: PurchaseHistory,
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }
];