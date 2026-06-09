import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({ template: '', standalone: true })
class StubComponent {}

function mockActivatedRoute(redirect: string | null = null) {
  return { snapshot: { queryParamMap: { get: () => redirect } } };
}

describe('LoginComponent', () => {
  let loginSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loginSpy = vi.fn().mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: '**', component: StubComponent }]),
        {
          provide: AuthService,
          useValue: {
            login: loginSpy,
            isLoading: signal(false),
            isAuthenticated: signal(false),
          },
        },
        { provide: ActivatedRoute, useValue: mockActivatedRoute() },
      ],
    }).compileComponents();
  });

  it('renders an email input and a password input', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('marks both controls as touched and does not call login on an empty submit', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as LoginComponent & {
      form: { controls: { email: { touched: boolean }; password: { touched: boolean } } };
    };

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(loginSpy).not.toHaveBeenCalled();
    expect(comp.form.controls.email.touched).toBe(true);
    expect(comp.form.controls.password.touched).toBe(true);
  });

  it('calls authService.login with the entered credentials on a valid submit', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as LoginComponent & {
      form: { setValue(v: unknown): void };
    };

    comp.form.setValue({ email: 'jane@eaglebank.com', password: 'Password123!' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(loginSpy).toHaveBeenCalledWith('jane@eaglebank.com', 'Password123!');
  });

  it('sets the serverError signal when login returns an error', () => {
    loginSpy.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials.' } })));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as LoginComponent & {
      form: { setValue(v: unknown): void };
      serverError: () => string | null;
    };

    comp.form.setValue({ email: 'jane@eaglebank.com', password: 'Password123!' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(comp.serverError()).toBe('Invalid credentials.');
  });

  it('returns the email validation error when the email is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as LoginComponent & {
      emailError: () => string | null;
      form: { controls: { email: { setValue(v: string): void; markAsTouched(): void } } };
    };

    comp.form.controls.email.setValue('not-an-email');
    comp.form.controls.email.markAsTouched();

    expect(comp.emailError()).toBe('Please enter a valid email address.');
  });

  it('returns the password validation error when the password is too short', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as LoginComponent & {
      passwordError: () => string | null;
      form: { controls: { password: { setValue(v: string): void; markAsTouched(): void } } };
    };

    comp.form.controls.password.setValue('short');
    comp.form.controls.password.markAsTouched();

    expect(comp.passwordError()).toBe('Password must be at least 8 characters.');
  });
});

