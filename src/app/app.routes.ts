import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/visitor.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'detalles',
    loadComponent: () => 
      import('./features/anfitrion/detalles-visita.component').then(m => m.DetallesVisitaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'visita-inesperada',
    loadComponent: () => 
      import('./features/recepcion/visita-inesperada.component').then(m => m.VisitaInesperadaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'kiosco',
    loadComponent: () => 
      import('./features/kiosco/kiosco.component').then(m => m.KioscoComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => 
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: 'anfitrion',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => 
          import('./features/anfitrion/anfitrion-dashboard.component').then(m => m.AnfitrionDashboardComponent)
      },
      {
        path: 'preautorizacion',
        loadComponent: () => 
          import('./features/anfitrion/preautorizacion-visita.component').then(m => m.PreautorizacionVisitaComponent)
      }
    ]
  },
  {
    path: 'visitante',
    children: [
      {
        path: 'solicitud',
        loadComponent: () => 
          import('./features/visitante/solicitud-visita.component').then(m => m.SolicitudVisitaComponent)
      }
    ]
  },
  {
    path: 'admin',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => 
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
