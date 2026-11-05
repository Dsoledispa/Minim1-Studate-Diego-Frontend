import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Plan } from '../../models';
import { PlansList } from './plans-list';

const laia = { _id: 'u3', name: 'Laia Puig', email: 'laia@example.com' };
const pau = { _id: 'u4', name: 'Pau Ferrer', email: 'pau@example.com' };

// Un Plan tal como llega con el populate: el Date con los dos usuarios dentro
const plan: Plan = {
  _id: 'p1',
  date: { _id: 'd1', users: [laia, pau], status: 'ongoing', expiresAt: '2099-01-01T10:00:00.000Z' },
  status: 'confirmed',
  spins: [
    {
      _id: 's1',
      place: 'Cafetería de la EETAC',
      walkingMinutes: 1,
      scheduledAt: '2026-11-06T10:00:00.000Z',
      accepted: false,
    },
    {
      _id: 's2',
      place: 'Biblioteca del Campus del Baix Llobregat',
      walkingMinutes: 4,
      scheduledAt: '2026-11-07T16:00:00.000Z',
      accepted: true,
    },
  ],
  deleted: false,
  createdAt: '2026-11-05T10:00:00.000Z',
};

const archivedPlan: Plan = { ...plan, _id: 'p2', deleted: true, status: 'cancelled' };

const page = (plans: Plan[]) => ({ plans, total: plans.length, page: 1, pages: 1 });

describe('PlansList', () => {
  let component: PlansList;
  let fixture: ComponentFixture<PlansList>;
  let httpMock: HttpTestingController;
  const plansUrl = `${environment.apiUrl}/plans`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlansList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PlansList);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Al empezar se pide la primera página sin filtros
    httpMock.expectOne(`${plansUrl}?page=1&limit=10`).flush(page([plan]));
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('shows the couple, the status and the accepted spin of each plan', () => {
    const row = (fixture.nativeElement as HTMLElement).querySelector('tbody tr');

    expect(row?.textContent).toContain('Laia Puig');
    expect(row?.textContent).toContain('Pau Ferrer');
    expect(row?.textContent).toContain('Confirmado');
    expect(row?.querySelector('li.accepted')?.textContent).toContain('Biblioteca');
    expect(row?.textContent).toContain('Archivar');
  });

  it('combines the text search and the status in the same request', () => {
    component.search.set('cafe');
    component.status.set('confirmed');
    component.loadPage(1);

    httpMock.expectOne(`${plansUrl}?page=1&limit=10&search=cafe&status=confirmed`).flush(page([]));
  });

  it('filters by the Date it receives and lets the parent clear it', () => {
    let cleared = false;
    component.dateCleared.subscribe(() => (cleared = true));

    fixture.componentRef.setInput('date', { id: 'd1', name: 'Laia Puig y Pau Ferrer' });
    fixture.detectChanges();
    httpMock.expectOne(`${plansUrl}?page=1&limit=10&date=d1`).flush(page([]));
    fixture.detectChanges();

    expect(text()).toContain('Date: Laia Puig y Pau Ferrer');
    expect(text()).toContain('Si lo archivaste, míralo en "Archivados"');

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.chip button')
      ?.click();
    expect(cleared).toBe(true);
  });

  it('shows the archived plans', () => {
    component.setArchived(true);

    httpMock.expectOne(`${plansUrl}?page=1&limit=10&archived=true`).flush(page([archivedPlan]));
    fixture.detectChanges();
    expect(text()).toContain('Planes archivados');
    expect(text()).toContain('Restaurar');
  });

  it('archives after confirming in the modal and reloads the page', () => {
    component.askArchive(plan);
    fixture.detectChanges();
    expect(text()).toContain('El Plan de Laia Puig y Pau Ferrer pasa a "Archivados"');

    component.confirmAction();
    expect(httpMock.expectOne(`${plansUrl}/p1/archive`).request.method).toBe('POST');
  });

  it('restores and deletes archived plans', () => {
    component.restore(archivedPlan);
    httpMock.expectOne(`${plansUrl}/p2/restore`).flush({ plan });
    httpMock.expectOne(`${plansUrl}?page=1&limit=10`).flush(page([plan]));

    component.askDelete(archivedPlan);
    component.confirmAction();
    expect(httpMock.expectOne(`${plansUrl}/p2`).request.method).toBe('DELETE');
  });

  it('shows the API message when a plan cannot be deleted', () => {
    component.askDelete(plan);
    component.confirmAction();

    httpMock
      .expectOne(`${plansUrl}/p1`)
      .flush(
        { message: 'Archiva el Plan antes de eliminarlo' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(component.error()).toBe('Archiva el Plan antes de eliminarlo');
  });

  it('asks the API for the next page', () => {
    component.loadPage(2);

    httpMock.expectOne(`${plansUrl}?page=2&limit=10`).flush({ ...page([]), page: 2 });
    expect(component.page()).toBe(2);
  });
});
