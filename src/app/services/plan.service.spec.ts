import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { SpinInput } from '../models';
import { PlanService } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/plans`;
  const emptyPage = { plans: [], total: 0, page: 1, pages: 0 };
  const spin: SpinInput = {
    place: 'Cafetería de la EETAC',
    walkingMinutes: 1,
    scheduledAt: '2026-11-12T17:00:00.000Z',
    accepted: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends only the page when there are no filters', () => {
    service.getPlans(1, 10, { search: '  ', status: '', date: '', archived: false }).subscribe();
    httpMock.expectOne(`${baseUrl}?page=1&limit=10`).flush(emptyPage);
  });

  it('combines the text search with the other filters in the same request', () => {
    service
      .getPlans(2, 10, { search: ' cafe ', status: 'confirmed', date: 'd1', archived: true })
      .subscribe();
    httpMock
      .expectOne(`${baseUrl}?page=2&limit=10&search=cafe&status=confirmed&date=d1&archived=true`)
      .flush(emptyPage);
  });

  it('reads, creates and updates a plan', () => {
    service.getPlan('p1').subscribe();
    service.createPlan({ date: 'd1', spins: [spin] }).subscribe();
    service.updatePlan('p1', { status: 'confirmed', spins: [spin] }).subscribe();

    expect(httpMock.expectOne((request) => request.method === 'GET').request.url).toBe(
      `${baseUrl}/p1`,
    );
    expect(httpMock.expectOne((request) => request.method === 'POST').request.body).toEqual({
      date: 'd1',
      spins: [spin],
    });
    const put = httpMock.expectOne((request) => request.method === 'PUT');
    expect(put.request.url).toBe(`${baseUrl}/p1`);
    expect(put.request.body).toEqual({ status: 'confirmed', spins: [spin] });
  });

  it('archives, restores and deletes', () => {
    service.archivePlan('p1').subscribe();
    service.restorePlan('p1').subscribe();
    service.deletePlan('p1').subscribe();

    expect(httpMock.expectOne(`${baseUrl}/p1/archive`).request.method).toBe('POST');
    expect(httpMock.expectOne(`${baseUrl}/p1/restore`).request.method).toBe('POST');
    expect(httpMock.expectOne((request) => request.method === 'DELETE').request.url).toBe(
      `${baseUrl}/p1`,
    );
  });
});
