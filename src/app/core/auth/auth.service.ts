import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { User } from '../../shared/models';

interface LoginResponse {
  token: string;
  user: User;
}
interface RegisterData {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(null);
  private _isLoading = signal<boolean>(true);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor() {
    this.hydrateSession();
  }

  private hydrateSession(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this._isLoading.set(false);
      return;
    }
    this.http
      .get<{ user: User }>('/api/auth/me')
      .pipe(
        tap(({ user }) => this._user.set(user)),
        catchError(() => {
          localStorage.removeItem('auth_token');
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(({ token, user }) => {
        localStorage.setItem('auth_token', token);
        this._user.set(user);
      }),
      map(() => void 0),
    );
  }

  register(data: RegisterData): Observable<void> {
    return this.http.post<LoginResponse>('/api/auth/register', data).pipe(
      tap(({ token, user }) => {
        localStorage.setItem('auth_token', token);
        this._user.set(user);
      }),
      map(() => void 0),
    );
  }

  logout(): void {
    this.http
      .post('/api/auth/logout', {})
      .pipe(
        catchError(() => EMPTY),
        finalize(() => {
          localStorage.removeItem('auth_token');
          this._user.set(null);
          this.router.navigate(['/login']);
        }),
      )
      .subscribe();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
