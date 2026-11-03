import { Routes } from '@angular/router';

import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { authGuard, guestGuard } from './guards/auth.guard';

// canActivate: los guards que se comprueban, en orden, antes de entrar en la ruta.
//   guestGuard            solo sin sesión (login y registro)
//   authGuard             solo con sesión; si no, al login
//   authGuard, adminGuard con sesión y además rol admin; un user vuelve a la página de inicio
// Las pantallas de Studate (usuarios, La Orla y Dates) se añaden en sus ramas.
export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard], title: 'Inicio' },
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión' },
  { path: 'register', component: Register, canActivate: [guestGuard], title: 'Crear cuenta' },

  // Cualquier otra URL vuelve a la página de inicio (o al login, si no hay sesión)
  { path: '**', redirectTo: '' },
];
