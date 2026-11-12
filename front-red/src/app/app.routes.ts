import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/publicaciones', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((c) => c.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((c) => c.RegisterComponent),
  },
  {
    path: 'publicaciones',
    loadComponent: () => import('./features/publicaciones/publicaciones').then((c) => c.Publicaciones),
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./features/mi-perfil/mi-perfil').then((c) => c.MiPerfil),
  },
  { path: '**', redirectTo: '/publicaciones' },
];
