import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { sanitizeRedirect } from '../../../core/auth/auth.guard';
import { AuthLayoutComponent } from '../auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password');
  const confirm = group.get('confirmPassword');
  if (!password || !confirm || !confirm.value) return null;

  if (password.value !== confirm.value) {
    confirm.setErrors({ ...confirm.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }

  if (confirm.errors) {
    const { passwordMismatch: _, ...rest } = confirm.errors;
    confirm.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}

@Component({
  selector: 'app-register',
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
        <h1 class="text-xl font-bold text-text-primary">Create your account</h1>
        <p class="mt-1 text-sm text-text-secondary">Get started with Eagle Bank today.</p>
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
        aria-label="Create account form"
        class="flex flex-col gap-5"
      >
        <eb-input
          formControlName="name"
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          autocomplete="name"
          [required]="true"
          [error]="nameError()"
        />

        <eb-input
          formControlName="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          [required]="true"
          [error]="emailError()"
        />

        <eb-input
          formControlName="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autocomplete="new-password"
          [required]="true"
          hint="At least 8 characters."
          [error]="passwordError()"
        />

        <eb-input
          formControlName="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          autocomplete="new-password"
          [required]="true"
          [error]="confirmPasswordError()"
        />

        <eb-button
          type="submit"
          [loading]="isSubmitting()"
          [disabled]="isSubmitting()"
          [fullWidth]="true"
          class="mt-1"
        >
          Create account
        </eb-button>
      </form>

      <p class="mt-6 text-center text-sm text-text-secondary">
        Already have an account?
        <a
          [routerLink]="['/login']"
          [queryParams]="redirectParam()"
          class="text-primary-600 font-medium hover:text-primary-700 hover:underline"
        >
          Sign in
        </a>
      </p>
    </app-auth-layout>
  `,
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected isSubmitting = signal(false);
  protected serverError = signal<string | null>(null);
  protected redirectUrl = signal('/dashboard');

  protected form = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.redirectUrl.set(sanitizeRedirect(redirect));
  }

  protected redirectParam() {
    const url = this.redirectUrl();
    return url !== '/dashboard' ? { redirect: url } : {};
  }

  protected nameError() {
    const control = this.form.controls.name;
    if (!control.invalid || !control.touched) return null;
    if (control.hasError('required')) return 'Full name is required.';
    if (control.hasError('minlength')) return 'Name must be at least 2 characters.';
    return null;
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

  protected confirmPasswordError() {
    const control = this.form.controls.confirmPassword;
    if (!control.invalid || !control.touched) return null;
    if (control.hasError('required')) return 'Please confirm your password.';
    if (control.hasError('passwordMismatch')) return 'Passwords do not match.';
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const { name, email, password } = this.form.getRawValue();

    this.auth
      .register({ name, email, password })
      .pipe(
        tap(() => this.router.navigateByUrl(this.redirectUrl())),
        catchError((err) => {
          this.serverError.set(err?.error?.message ?? 'Registration failed. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe();
  }
}
