import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/publicaciones', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((componente) => componente.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((componente) => componente.RegisterComponent),
  },
  {
    path: 'publicaciones',
    loadComponent: () => import('./features/publicaciones/publicaciones').then((componente) => componente.Publicaciones),
  },
  {
    // el :id es el parametro de la url, o sea el id de la publicacion que queremos ver
    path: 'publicaciones/:id',
    loadComponent: () => import('./features/publicacion-detalle/publicacion-detalle').then((componente) => componente.PublicacionDetalle),
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./features/mi-perfil/mi-perfil').then((componente) => componente.MiPerfil),
  },
  { path: '**', redirectTo: '/publicaciones' },
];
