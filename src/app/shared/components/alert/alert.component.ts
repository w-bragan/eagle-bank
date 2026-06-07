import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

const VARIANT_CLASSES: Record<AlertVariant, { wrapper: string; icon: string }> = {
  error: {
    wrapper: 'bg-error-light border-error/30 text-error-dark',
    icon: 'text-error',
  },
  warning: {
    wrapper: 'bg-warning-light border-warning/30 text-warning-dark',
    icon: 'text-warning',
  },
  success: {
    wrapper: 'bg-success-light border-success/30 text-success-dark',
    icon: 'text-success',
  },
  info: { wrapper: 'bg-primary-100 border-primary-200 text-primary-900', icon: 'text-primary-600' },
};

@Component({
  selector: 'eb-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="alert"
      [class]="
        'flex items-center gap-3 rounded border px-4 py-3 text-sm animate-fade-in ' +
        variant().wrapper
      "
    >
      <span
        class="material-icons text-[18px] leading-none mt-0.5 shrink-0"
        [class]="variant().icon"
        aria-hidden="true"
        >{{ alertIcon() }}</span
      >
      <span>{{ message() }}</span>
    </div>
  `,
})
export class AlertComponent {
  type = input<AlertVariant>('error');
  message = input.required<string>();

  protected variant = computed(() => VARIANT_CLASSES[this.type()]);
  protected alertIcon = computed(
    () =>
      ({
        error: 'error',
        warning: 'warning',
        success: 'check_circle',
        info: 'info',
      })[this.type()],
  );
}
