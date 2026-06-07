import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'error';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE = [
  'inline-flex items-center justify-center gap-2 font-medium rounded',
  'transition-colors duration-150 cursor-pointer select-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary:
    'bg-surface text-text-primary border border-border hover:bg-surface-subtle active:bg-surface-subtle',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle',
  error: 'bg-error text-white hover:opacity-90 active:opacity-80',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

@Component({
  selector: 'eb-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
      [class]="classes()"
    >
      @if (loading()) {
        <svg
          class="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);

  protected classes = computed(() =>
    [BASE, VARIANT_CLASSES[this.variant()], SIZES[this.size()], this.fullWidth() ? 'w-full' : ''].join(
      ' ',
    ),
  );
}
