import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { UserFilters, UsersPage } from '../models';

// Las llamadas a la gestión de usuarios del backoffice (/users). Todas son solo para admin:
// el interceptor añade el token y la API responde 403 si quien llama no es admin
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  /** GET /users con la página y los filtros. Solo se envían los filtros que tienen valor */
  getUsers(page: number, limit: number, filters: UserFilters): Observable<UsersPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.active) {
      params = params.set('active', filters.active);
    }
    if (filters.degree) {
      params = params.set('degree', filters.degree);
    }
    if (filters.archived) {
      params = params.set('archived', true);
    }

    return this.http.get<UsersPage>(this.baseUrl, { params });
  }
}
