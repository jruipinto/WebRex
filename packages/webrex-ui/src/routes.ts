import { Route } from '@angular/router';

export const routes: Route[] = [
  {
    path: 'repl',
    loadComponent: () => import('./pages').then((m) => m.ReplComponent),
  },
  {
    path: 'interceptors',
    loadComponent: () => import('./pages').then((m) => m.InterceptorsComponent),
  },
  {
    path: 'storage',
    loadComponent: () => import('./pages').then((m) => m.StorageComponent),
  },
  {
    path: 'console',
    loadComponent: () => import('./pages').then((m) => m.ConsoleLogsComponent),
  },
  {
    path: 'network',
    loadComponent: () => import('./pages').then((m) => m.ProxyLogsComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages').then((m) => m.SettingsComponent),
  },
  {
    path: '**',
    redirectTo: 'repl',
  },
];
