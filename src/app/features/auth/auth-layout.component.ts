import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface-muted flex flex-col items-center justify-center p-4">
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center shadow-md"
          >
            <span class="material-icons text-white text-[18px] leading-none" aria-hidden="true"
              >account_balance</span
            >
          </div>
          <span class="text-2xl font-bold text-text-primary tracking-tight">Eagle Bank</span>
        </div>
        <p class="text-sm text-text-muted">Secure. Simple. Yours.</p>
      </div>

      <div
        class="w-full max-w-md bg-surface rounded-xl border border-border shadow-card p-8 animate-slide-up"
      >
        <ng-content />
      </div>

      <p class="mt-6 text-xs text-text-muted text-center">
        &copy; {{ year }} Eagle Bank. All rights reserved.
      </p>
    </div>
  `,
})
export class AuthLayoutComponent {
  protected readonly year = new Date().getFullYear();
}
