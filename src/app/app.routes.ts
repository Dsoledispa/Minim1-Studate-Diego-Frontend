import { Routes } from '@angular/router';

import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { UserForm } from './components/user-form/user-form';
import { UsersList } from './components/users-list/users-list';
import { adminGuard, authGuard, guestGuard } from './guards/auth.guard';

// canActivate: los guards que se comprueban, en orden, antes de entrar en la ruta.
//   guestGuard            solo sin sesión (login y registro)
//   authGuard             solo con sesión; si no, al login
//   authGuard, adminGuard con sesión y además rol admin; un user vuelve a la página de inicio
export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard], title: 'Inicio' },
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión' },
  { path: 'register', component: Register, canActivate: [guestGuard], title: 'Crear cuenta' },

  // Backoffice: solo admin
  { path: 'users', component: UsersList, canActivate: [authGuard, adminGuard], title: 'Usuarios' },
  {
    path: 'users/new',
    component: UserForm,
    canActivate: [authGuard, adminGuard],
    title: 'Nuevo usuario',
  },
  {
    path: 'users/:id/edit',
    component: UserForm,
    canActivate: [authGuard, adminGuard],
    title: 'Editar usuario',
  },

  // Cualquier otra URL vuelve a la página de inicio (o al login, si no hay sesión)
  { path: '**', redirectTo: '' },
];
