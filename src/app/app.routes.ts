import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Inventory } from './pages/inventory/inventory';
import { Sales } from './pages/sales/sales';
import { Purchases} from './pages/purchases/purchases';
import { Reports} from './pages/reports/reports';

export const routes: Routes = [
  { path: '', component: Login },

  { path: 'dashboard', component: Dashboard },
  { path: 'inventory', component: Inventory },
  { path: 'sales', component: Sales },
  { path: 'purchases', component: Purchases },
  { path: 'reports', component: Reports },

  { path: '**', redirectTo: '' }
];