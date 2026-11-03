import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { User } from '../../models';
import { UsersList } from './users-list';

const laia: User = {
  _id: 'u3',
  name: 'Laia Puig',
  email: 'laia@example.com',
  role: 'user',
  degree: 'Grau en Enginyeria Telemàtica',
  active: true,
  deleted: false,
};

const aina: User = { ...laia, _id: 'u7', name: 'Aina Roca', email: 'aina@example.com', active: false };

describe('UsersList', () => {
  let component: UsersList;
  let fixture: ComponentFixture<UsersList>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/users`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock
      .expectOne(`${baseUrl}?page=1&limit=10`)
      .flush({ users: [laia, aina], total: 12, page: 1, pages: 2 });
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('paints one row per user with its state', () => {
    fixture.detectChanges();
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Laia Puig');
    expect(rows[0].textContent).toContain('Activo');
    expect(rows[1].textContent).toContain('Inactivo');
    expect(rows[1].classList).toContain('inactive');
  });

  it('asks the API for the selected page', () => {
    component.loadPage(2);

    httpMock.expectOne(`${baseUrl}?page=2&limit=10`).flush({ users: [], total: 12, page: 2, pages: 2 });

    expect(component.page()).toBe(2);
    expect(component.totalPages()).toBe(2);
  });

  it('goes back to the first page with the filters when one changes', () => {
    component.loadPage(2);
    httpMock.expectOne(`${baseUrl}?page=2&limit=10`).flush({ users: [], total: 12, page: 2, pages: 2 });

    component.role.set('admin');
    component.archived.set(true);
    component.loadPage(1);

    httpMock
      .expectOne(`${baseUrl}?page=1&limit=10&role=admin&archived=true`)
      .flush({ users: [], total: 0, page: 1, pages: 0 });

    expect(component.page()).toBe(1);
    expect(component.total()).toBe(0);
    expect(component.totalPages()).toBe(1);
  });
});
