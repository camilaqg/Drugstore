import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Inventory } from './pages/inventory/inventory';
import { SalesComponent} from './pages/sales/sales';
import { Purchases} from './pages/purchases/purchases';
import { ReportsComponents} from './pages/reports/reports';
import { RegisterComponent } from './pages/register/register';


export const routes: Routes = [
  { path: '', component: Login },

  { path: 'dashboard', component: Dashboard },
  { path: 'inventory', component: Inventory },
  { path: 'sales', component: SalesComponent },
  { path: 'purchases', component: Purchases },
  { path: 'reports', component: ReportsComponents },
  { path: 'register', component: RegisterComponent },

  { path: '**', redirectTo: '' }
];