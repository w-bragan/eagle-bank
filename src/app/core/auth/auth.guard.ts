import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

function sanitizeRedirect(url: string | null | undefined): string {
  if (!url) return '/dashboard';
  if (!url.startsWith('/') || url.startsWith('//')) return '/dashboard';
  return url;
}

/** Blocks unauthenticated users */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoading()) {
    if (auth.isAuthenticated()) return true;
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }

  return toObservable(auth.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (auth.isAuthenticated()) return true;
      return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    }),
  );
};

/** Redirects authenticated users away from public-only routes */
export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoading()) {
    if (!auth.isAuthenticated()) return true;
    return router.createUrlTree(['/dashboard']);
  }

  return toObservable(auth.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (!auth.isAuthenticated()) return true;
      return router.createUrlTree(['/dashboard']);
    }),
  );
};

export { sanitizeRedirect };
