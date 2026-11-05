import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CreatePlan, PlanFilters, PlanResponse, PlansPage, UpdatePlan } from '../models';

// Todas las llamadas a los Planes (/plans) en un solo servicio. Son del backoffice: la API pide el
// token (lo pone el interceptor) y el rol admin, y responde 401 o 403 a los demás
@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/plans`;

  /** GET /plans con la página y los filtros (paginación de servidor). Solo se envían los que tienen valor */
  getPlans(page: number, limit: number, filters: PlanFilters): Observable<PlansPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.date) {
      params = params.set('date', filters.date);
    }
    if (filters.archived) {
      params = params.set('archived', true);
    }

    return this.http.get<PlansPage>(this.baseUrl, { params });
  }

  /** GET /plans/:id (también si está archivado) */
  getPlan(id: string): Observable<PlanResponse> {
    return this.http.get<PlanResponse>(`${this.baseUrl}/${id}`);
  }

  /** POST /plans (409 si el Date está cerrado o ya tiene Plan) */
  createPlan(payload: CreatePlan): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(this.baseUrl, payload);
  }

  /** PUT /plans/:id: el estado y las tiradas (409 si está archivado) */
  updatePlan(id: string, payload: UpdatePlan): Observable<PlanResponse> {
    return this.http.put<PlanResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /** POST /plans/:id/archive: borrado lógico, se puede restaurar */
  archivePlan(id: string): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.baseUrl}/${id}/archive`, {});
  }

  /** POST /plans/:id/restore */
  restorePlan(id: string): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.baseUrl}/${id}/restore`, {});
  }

  /** DELETE /plans/:id: borrado físico, solo si está archivado (409 si no) */
  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
