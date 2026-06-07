import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { sanitizeRedirect } from '../../../core/auth/auth.guard';
import { AuthLayoutComponent } from '../auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    InputComponent,
    AlertComponent,
  ],
  template: `
    <app-auth-layout>
      <div class="mb-6">
        <h1 class="text-xl font-bold text-text-primary">Sign in to your account</h1>
        <p class="mt-1 text-sm text-text-secondary">
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      @if (serverError()) {
        <div class="mb-5">
          <eb-alert [message]="serverError()!" type="error" />
        </div>
      }

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        novalidate
        aria-label="Sign in form"
        class="flex flex-col gap-5"
      >
        <eb-input
          formControlName="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autocomplete="username"
          [required]="true"
          [error]="emailError()"
        />

        <eb-input
          formControlName="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          [required]="true"
          [error]="passwordError()"
        />

        <eb-button
          type="submit"
          [loading]="isSubmitting()"
          [disabled]="isSubmitting()"
          [fullWidth]="true"
          class="mt-1"
        >
          Sign in
        </eb-button>
      </form>

      <p class="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?
        <a
          [routerLink]="['/register']"
          [queryParams]="redirectParam()"
          class="text-primary-600 font-medium hover:text-primary-700 hover:underline"
        >
          Create one
        </a>
      </p>
    </app-auth-layout>
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected isSubmitting = signal(false);
  protected serverError = signal<string | null>(null);
  protected redirectUrl = signal('/dashboard');

  protected form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  ngOnInit(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.redirectUrl.set(sanitizeRedirect(redirect));
  }

  protected redirectParam() {
    const url = this.redirectUrl();
    return url !== '/dashboard' ? { redirect: url } : {};
  }

  protected emailError() {
    const control = this.form.controls.email;
    if (!control.invalid || !control.touched) return null;
    if (control.hasError('required')) return 'Email address is required.';
    if (control.hasError('email')) return 'Please enter a valid email address.';
    return null;
  }

  protected passwordError() {
    const control = this.form.controls.password;
    if (!control.invalid || !control.touched) return null;
    if (control.hasError('required')) return 'Password is required.';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters.';
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(
        tap(() => this.router.navigateByUrl(this.redirectUrl())),
        catchError((err) => {
          this.serverError.set(err?.error?.message ?? 'Sign in failed. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe();
  }
}
