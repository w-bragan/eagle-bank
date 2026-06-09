import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from './auth.service';
import { authGuard, publicOnlyGuard, sanitizeRedirect } from './auth.guard';

describe('sanitizeRedirect', () => {
  it('returns /dashboard for null', () => expect(sanitizeRedirect(null)).toBe('/dashboard'));
  it('returns /dashboard for undefined', () => expect(sanitizeRedirect(undefined)).toBe('/dashboard'));
  it('returns /dashboard for an empty string', () => expect(sanitizeRedirect('')).toBe('/dashboard'));
  it('returns /dashboard for an http:// URL', () => expect(sanitizeRedirect('http://evil.com')).toBe('/dashboard'));
  it('returns /dashboard for an https:// URL', () => expect(sanitizeRedirect('https://evil.com')).toBe('/dashboard'));
  it('returns /dashboard for a protocol-relative URL', () => expect(sanitizeRedirect('//evil.com')).toBe('/dashboard'));
  it('returns the path for a valid internal path', () => expect(sanitizeRedirect('/accounts')).toBe('/accounts'));
  it('returns the path for a nested internal path', () => expect(sanitizeRedirect('/accounts/acc1')).toBe('/accounts/acc1'));
});

function setupGuardEnv(isAuthenticated: boolean) {
  const isLoading = signal(false);
  const isAuth = signal(isAuthenticated);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: { isLoading: isLoading.asReadonly(), isAuthenticated: isAuth.asReadonly() },
      },
    ],
  });
  return { router: TestBed.inject(Router) };
}

describe('authGuard', () => {
  it('returns true when the user is authenticated', () => {
    setupGuardEnv(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });

  it('returns a UrlTree to /login when the user is not authenticated', () => {
    const { router } = setupGuardEnv(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/accounts' } as RouterStateSnapshot),
    );
    expect(result).toEqual(
      router.createUrlTree(['/login'], { queryParams: { redirect: '/accounts' } }),
    );
  });
});

describe('publicOnlyGuard', () => {
  it('returns true when the user is not authenticated', () => {
    setupGuardEnv(false);
    const result = TestBed.runInInjectionContext(() =>
      publicOnlyGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });

  it('returns a UrlTree to /dashboard when the user is already authenticated', () => {
    const { router } = setupGuardEnv(true);
    const result = TestBed.runInInjectionContext(() =>
      publicOnlyGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });
});
