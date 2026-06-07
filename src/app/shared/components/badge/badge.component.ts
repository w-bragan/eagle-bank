import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-primary-100 text-primary-800',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  error: 'bg-error-light text-error-dark',
  info: 'bg-primary-50 text-primary-700',
  muted: 'bg-surface-subtle text-text-secondary',
};

@Component({
  selector: 'eb-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="cls()">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');

  protected cls = computed(
    () =>
      `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANT_CLASSES[this.variant()]}`,
  );
}
