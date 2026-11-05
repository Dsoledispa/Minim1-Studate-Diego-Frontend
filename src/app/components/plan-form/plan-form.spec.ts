import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Plan, StudateDate } from '../../models';
import { PlanForm } from './plan-form';

const hugo = { _id: 'u5', name: 'Hugo Martín', email: 'hugo@example.com' };
const julia = { _id: 'u6', name: 'Júlia Serra', email: 'julia@example.com' };
const nerea = { _id: 'u7', name: 'Nerea Gil', email: 'nerea@example.com' };
const marc = { _id: 'u8', name: 'Marc Soler', email: 'marc@example.com' };

const openDate: StudateDate = {
  _id: 'd3',
  users: [hugo, julia],
  status: 'pending',
  firstTurn: 'u6',
  expiresAt: '2099-01-01T10:00:00.000Z',
  extended: false,
  createdAt: '2026-11-05T10:00:00.000Z',
};
const closedDate: StudateDate = { ...openDate, _id: 'd2', users: [nerea, marc], status: 'closed' };

const plan: Plan = {
  _id: 'p1',
  date: {
    _id: 'd3',
    users: [hugo, julia],
    status: 'pending',
    expiresAt: '2099-01-01T10:00:00.000Z',
  },
  status: 'confirmed',
  spins: [
    {
      _id: 's1',
      place: 'Bar de la plaça de Castelldefels',
      walkingMinutes: 20,
      scheduledAt: '2026-11-07T19:00:00.000Z',
      accepted: false,
    },
    {
      _id: 's2',
      place: 'Platja de Castelldefels',
      walkingMinutes: 25,
      scheduledAt: '2026-11-09T17:00:00.000Z',
      accepted: true,
    },
  ],
  deleted: false,
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
};

describe('PlanForm', () => {
  let component: PlanForm;
  let fixture: ComponentFixture<PlanForm>;
  let httpMock: HttpTestingController;
  const plansUrl = `${environment.apiUrl}/plans`;
  const datesUrl = `${environment.apiUrl}/dates?page=1&limit=100`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  // Crea el formulario: sin planId es "Nuevo Plan" (pide los Dates); con planId pide el detalle
  function create(planId: string | null, dateId = ''): void {
    fixture = TestBed.createComponent(PlanForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('planId', planId);
    fixture.componentRef.setInput('dateId', dateId);
    fixture.detectChanges();
  }

  function createNew(dateId = ''): void {
    create(null, dateId);
    httpMock
      .expectOne(datesUrl)
      .flush({ dates: [openDate, closedDate], total: 2, page: 1, pages: 1 });
    fixture.detectChanges();
  }

  function fillFirstSpin(): void {
    component.spins.at(0).setValue({
      place: '  Cafetería de la EETAC ',
      walkingMinutes: 1,
      scheduledAt: '2026-11-12T18:00',
      accepted: false,
    });
  }

  it('offers only the open Dates and starts with the Date it receives and one empty spin', () => {
    createNew('d3');

    expect(component.title()).toBe('Nuevo Plan');
    expect(component.dates().map((date) => date._id)).toEqual(['d3']);
    expect(component.form.controls.date.value).toBe('d3');
    expect(component.spins.length).toBe(1);
    expect(component.form.invalid).toBe(true);
  });

  it('needs an accepted spin to confirm and keeps only one accepted', () => {
    createNew('d3');
    fillFirstSpin();
    component.addSpin();
    component.spins.at(1).setValue({
      place: 'Parc del Canal Olímpic',
      walkingMinutes: 15,
      scheduledAt: '2026-11-13T18:00',
      accepted: false,
    });

    component.form.controls.status.setValue('confirmed');
    fixture.detectChanges();
    expect(component.form.hasError('confirmedWithoutAccepted')).toBe(true);
    expect(text()).toContain('Un Plan confirmado necesita una tirada aceptada');

    component.spins.at(0).controls.accepted.setValue(true);
    component.spins.at(1).controls.accepted.setValue(true);
    component.onAccepted(1, true);
    expect(component.spins.controls.map((spin) => spin.controls.accepted.value)).toEqual([
      false,
      true,
    ]);
    expect(component.form.valid).toBe(true);
  });

  it('adds up to three spins and never removes the last one', () => {
    createNew();

    component.addSpin();
    component.addSpin();
    component.addSpin();
    expect(component.spins.length).toBe(3);

    component.removeSpin(0);
    component.removeSpin(0);
    component.removeSpin(0);
    expect(component.spins.length).toBe(1);
  });

  it('creates the plan with ISO dates and without _id, and emits saved', () => {
    createNew('d3');
    fillFirstSpin();
    let saved: Plan | undefined;
    component.saved.subscribe((value) => (saved = value));

    component.save();

    const request = httpMock.expectOne(plansUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      date: 'd3',
      status: 'proposing',
      spins: [
        {
          place: 'Cafetería de la EETAC',
          walkingMinutes: 1,
          scheduledAt: new Date('2026-11-12T18:00').toISOString(),
          accepted: false,
        },
      ],
    });
    request.flush({ plan });
    expect(saved).toEqual(plan);
  });

  it('loads the detail, keeps the Date locked and updates without _id', () => {
    create('p1');
    httpMock.expectOne(`${plansUrl}/p1`).flush({ plan });
    fixture.detectChanges();

    expect(component.title()).toBe('Editar Plan');
    expect(text()).toContain('Hugo Martín y Júlia Serra');
    expect(component.form.controls.date.disabled).toBe(true);
    expect(component.spins.length).toBe(2);

    component.save();

    const request = httpMock.expectOne(`${plansUrl}/p1`);
    expect(request.request.method).toBe('PUT');
    // Las fechas vuelven a la API tal cual llegaron: el paso por el input local no las cambia
    expect(request.request.body).toEqual({
      status: 'confirmed',
      spins: plan.spins.map(({ place, walkingMinutes, scheduledAt, accepted }) => ({
        place,
        walkingMinutes,
        scheduledAt,
        accepted,
      })),
    });
  });

  it('shows the API message when the Date already has a plan', () => {
    createNew('d3');
    fillFirstSpin();

    component.save();
    httpMock
      .expectOne(plansUrl)
      .flush({ message: 'Este Date ya tiene un Plan' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(text()).toContain('Este Date ya tiene un Plan');
    expect(component.saving()).toBe(false);
  });

  it('shows an archived plan read-only', () => {
    create('p2');
    httpMock.expectOne(`${plansUrl}/p2`).flush({ plan: { ...plan, _id: 'p2', deleted: true } });
    fixture.detectChanges();

    expect(component.title()).toBe('Plan archivado');
    expect(component.form.disabled).toBe(true);
    expect(text()).toContain('restáuralo desde la lista');
    expect(text()).not.toContain('Guardar');
  });
});
