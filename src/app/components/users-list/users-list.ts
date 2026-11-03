import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, finalize, switchMap, tap } from 'rxjs';

import { DEGREES, User, UserFilters } from '../../models';
import { UserService } from '../../services/user.service';
import { apiErrorMessage } from '../../utils/api-error';
import { Avatar } from '../avatar/avatar';
import { Pagination } from '../pagination/pagination';

// 10 usuarios por página: se los pedimos así a la API (?limit=10)
export const PAGE_SIZE = 10;

// Lista de usuarios del backoffice. La paginación y los filtros los hace la API: cada vez que
// cambia la página o un filtro se pide la página que toca, como hacía la lista de libros del seminario
@Component({
  selector: 'app-users-list',
  imports: [FormsModule, Avatar, Pagination],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersList implements OnInit {
  private userService = inject(UserService);
  private pageRequests = new Subject<number>();

  // Las opciones del filtro de titulación
  degrees = DEGREES;

  users = signal<User[]>([]);
  total = signal(0);
  totalPages = signal(1);
  page = signal(1);
  loading = signal(true);
  error = signal('');

  // Los filtros, unidos a los campos de la barra de herramientas con [(ngModel)]
  search = signal('');
  role = signal<UserFilters['role']>('');
  active = signal<UserFilters['active']>('');
  degree = signal('');
  archived = signal(false);

  constructor() {
    // switchMap: si llega otra petición antes de que responda la anterior (por ejemplo, mientras
    // se escribe en el buscador), se cancela la vieja y solo cuenta la última
    this.pageRequests
      .pipe(
        switchMap((page) => {
          this.loading.set(true);
          this.error.set('');
          return this.userService.getUsers(page, PAGE_SIZE, this.filters()).pipe(
            tap((response) => {
              this.users.set(response.users);
              this.total.set(response.total);
              this.totalPages.set(Math.max(response.pages, 1));
              this.page.set(response.page);
            }),
            catchError((err: HttpErrorResponse) => {
              this.error.set(apiErrorMessage(err));
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.loadPage(1);
  }

  // Al cambiar un filtro se vuelve a la página 1: la página 3 de antes puede no existir con el filtro nuevo
  loadPage(page: number): void {
    this.page.set(page);
    this.pageRequests.next(page);
  }

  // Los filtros juntos, tal como los necesita UserService
  private filters(): UserFilters {
    return {
      search: this.search(),
      role: this.role(),
      active: this.active(),
      degree: this.degree(),
      archived: this.archived(),
    };
  }
}
