import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

@Component({ template: '', standalone: true })
class StubComponent {}

describe('AuthService — no existing session', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: StubComponent }])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated() is false initially', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isLoading() is false when there is no token', () => {
    expect(service.isLoading()).toBe(false);
  });

  describe('login()', () => {
    it('stores the token, sets the user, and resolves on success', () => {
      let resolved = false;
      service.login('jane@eaglebank.com', 'Password123!').subscribe(() => (resolved = true));

      const req = http.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'jane@eaglebank.com', password: 'Password123!' });
      req.flush({ token: 'test-token', user: { id: 'u1', name: 'Jane Smith', email: 'jane@eaglebank.com' } });

      expect(resolved).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.user()?.email).toBe('jane@eaglebank.com');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });

    it('propagates the error and stays unauthenticated on failure', () => {
      let caughtError: unknown;
      service.login('wrong@email.com', 'wrongpassword').subscribe({ error: (e) => (caughtError = e) });

      http.expectOne('/api/auth/login').flush(
        { message: 'Invalid email or password.' },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(caughtError).toBeTruthy();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('register()', () => {
    it('stores the token and sets the user on success', () => {
      let resolved = false;
      service
        .register({ name: 'New User', email: 'new@test.com', password: 'Pass123!' })
        .subscribe(() => (resolved = true));

      http.expectOne('/api/auth/register').flush({
        token: 'reg-token',
        user: { id: 'u99', name: 'New User', email: 'new@test.com' },
      });

      expect(resolved).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('reg-token');
    });
  });

  describe('logout()', () => {
    it('clears the token and sets user to null', () => {
      service['_user'].set({ id: 'u1', name: 'Jane', email: 'jane@test.com' });
      localStorage.setItem('auth_token', 'test-token');

      service.logout();
      http.expectOne('/api/auth/logout').flush({ success: true });

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('updateProfile()', () => {
    it('updates the user signal with the server response', () => {
      service['_user'].set({ id: 'u1', name: 'Jane Smith', email: 'jane@test.com' });

      let updated: unknown;
      service
        .updateProfile({ name: 'Jane Updated', phone: '+44 7700 999999' })
        .subscribe((u) => (updated = u));

      const req = http.expectOne('/api/profile');
      expect(req.request.method).toBe('PUT');
      req.flush({ id: 'u1', name: 'Jane Updated', email: 'jane@test.com', phone: '+44 7700 999999' });

      expect(updated).toMatchObject({ name: 'Jane Updated' });
      expect(service.user()?.name).toBe('Jane Updated');
      expect(service.user()?.phone).toBe('+44 7700 999999');
    });
  });
});

describe('AuthService — hydrateSession', () => {
  afterEach(() => localStorage.clear());

  it('fetches the user when a token exists in localStorage', () => {
    localStorage.setItem('auth_token', 'valid-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: StubComponent }])],
    });
    const svc = TestBed.inject(AuthService);
    const ctrl = TestBed.inject(HttpTestingController);

    ctrl
      .expectOne('/api/auth/me')
      .flush({ user: { id: 'u1', name: 'Jane Smith', email: 'jane@eaglebank.com' } });

    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.user()?.email).toBe('jane@eaglebank.com');
    ctrl.verify();
  });

  it('clears the token and stays unauthenticated on a 401 response', () => {
    localStorage.setItem('auth_token', 'stale-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: StubComponent }])],
    });
    const svc = TestBed.inject(AuthService);
    const ctrl = TestBed.inject(HttpTestingController);

    ctrl
      .expectOne('/api/auth/me')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(svc.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
    ctrl.verify();
  });
});
