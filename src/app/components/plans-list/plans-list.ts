import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, tap } from 'rxjs';

import {
  DATE_STATUS_LABELS,
  PLAN_STATUS_LABELS,
  PLAN_STATUS_PILLS,
  Plan,
  PlanFilters,
  PlanStatus,
} from '../../models';
import { PlanService } from '../../services/plan.service';
import { apiErrorMessage } from '../../utils/api-error';
import { Avatar } from '../avatar/avatar';
import { ConfirmModal } from '../confirm-modal/confirm-modal';
import { Pagination } from '../pagination/pagination';

// 10 Planes por página: se los pedimos así a la API (?limit=10)
export const PLAN_PAGE_SIZE = 10;

// El Date por el que se filtra la lista: lo elige el botón "Plan" de la tabla de Dates
export interface PlanDateFilter {
  id: string;
  // "Laia Puig y Pau Ferrer", para el chip del filtro
  name: string;
}

// Las acciones que piden confirmación con el modal
type PlanAction = 'archive' | 'delete';

// Lista de Planes del backoffice, dentro de la vista de Dates (solo la ve el admin).
// La paginación, la búsqueda y los filtros los hace la API: cada cambio pide la página que toca
@Component({
  selector: 'app-plans-list',
  imports: [FormsModule, DatePipe, Avatar, ConfirmModal, Pagination],
  templateUrl: './plans-list.html',
  styleUrl: './plans-list.css',
})
export class PlansList {
  private planService = inject(PlanService);
  private pageRequests = new Subject<number>();

  // El Date por el que filtrar (null = todos). Lo pone DatesList; quitarlo lo decide también ella
  date = input<PlanDateFilter | null>(null);
  dateCleared = output<void>();

  statusLabels = PLAN_STATUS_LABELS;
  statusPills = PLAN_STATUS_PILLS;
  statuses = Object.keys(PLAN_STATUS_LABELS) as PlanStatus[];
  dateStatusLabels = DATE_STATUS_LABELS;

  plans = signal<Plan[]>([]);
  total = signal(0);
  totalPages = signal(1);
  page = signal(1);
  loading = signal(true);
  error = signal('');

  // Los filtros de la barra: texto, estado y activos/archivados. Se combinan con el del Date
  search = signal('');
  status = signal<PlanFilters['status']>('');
  archived = signal(false);

  // El Plan y la acción que espera confirmación en el modal (null si el modal está cerrado)
  pending = signal<{ plan: Plan; action: PlanAction } | null>(null);

  modalTitle = computed(() =>
    this.pending()?.action === 'delete'
      ? '¿Estás seguro de que quieres eliminar este Plan?'
      : 'Archivar Plan',
  );

  modalMessage = computed(() => {
    const pending = this.pending();
    if (!pending) {
      return '';
    }

    const couple = this.coupleName(pending.plan);
    return pending.action === 'delete'
      ? `Se borrará el Plan de ${couple} para siempre. Esto no se puede deshacer.`
      : `El Plan de ${couple} pasa a "Archivados". Podrás restaurarlo.`;
  });

  modalConfirmText = computed(() =>
    this.pending()?.action === 'delete' ? 'Eliminar para siempre' : 'Archivar',
  );

  // Con el filtro por Date y sin resultados, el Plan puede estar archivado: se avisa
  emptyText = computed(() =>
    this.date() && !this.archived()
      ? 'Este Date no tiene un Plan activo. Si lo archivaste, míralo en "Archivados".'
      : 'No hay Planes con estos filtros',
  );

  constructor() {
    // switchMap: si llega otra petición antes de que responda la anterior (por ejemplo, mientras
    // se escribe en el buscador), se cancela la vieja y solo cuenta la última
    this.pageRequests
      .pipe(
        switchMap((page) => {
          this.loading.set(true);
          this.error.set('');
          return this.planService.getPlans(page, PLAN_PAGE_SIZE, this.filters()).pipe(
            tap((response) => {
              this.plans.set(response.plans);
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

    // Al empezar y cada vez que cambia el Date del filtro, se pide la página 1.
    // untracked: loadPage lee otras señales que no deben volver a disparar este efecto
    effect(() => {
      this.date();
      untracked(() => this.loadPage(1));
    });
  }

  // Al cambiar un filtro se vuelve a la página 1: la página 3 de antes puede no existir con el filtro nuevo
  loadPage(page: number): void {
    this.page.set(page);
    this.pageRequests.next(page);
  }

  setArchived(archived: boolean): void {
    this.archived.set(archived);
    this.loadPage(1);
  }

  coupleName(plan: Plan): string {
    return plan.date.users.map((user) => user.name).join(' y ');
  }

  askArchive(plan: Plan): void {
    this.pending.set({ plan, action: 'archive' });
  }

  askDelete(plan: Plan): void {
    this.pending.set({ plan, action: 'delete' });
  }

  cancelAction(): void {
    this.pending.set(null);
  }

  confirmAction(): void {
    const pending = this.pending();
    if (!pending) {
      return;
    }

    this.pending.set(null);
    const request =
      pending.action === 'delete'
        ? this.planService.deletePlan(pending.plan._id)
        : this.planService.archivePlan(pending.plan._id);
    this.run(request);
  }

  // Restaurar no pide confirmación: no se pierde nada y se puede volver a archivar
  restore(plan: Plan): void {
    this.run(this.planService.restorePlan(plan._id));
  }

  // Después de archivar, restaurar o eliminar, el Plan sale de la lista que se está viendo.
  // Se recarga la página actual; si era el último de la página, la anterior
  private run(request: Observable<unknown>): void {
    this.error.set('');
    request.subscribe({
      next: () => {
        const isLastOnPage = this.plans().length === 1 && this.page() > 1;
        this.loadPage(isLastOnPage ? this.page() - 1 : this.page());
      },
      // Con un 409 la API manda el motivo en message (por ejemplo, "Archiva el Plan antes de eliminarlo")
      error: (err: HttpErrorResponse) => this.error.set(apiErrorMessage(err)),
    });
  }

  // Los filtros juntos, tal como los necesita PlanService
  private filters(): PlanFilters {
    return {
      search: this.search(),
      status: this.status(),
      date: this.date()?.id ?? '',
      archived: this.archived(),
    };
  }
}
