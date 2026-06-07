import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  forwardRef,
  OnInit,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

let idCounter = 0;

@Component({
  selector: 'eb-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label [for]="inputId" class="text-sm font-medium text-text-primary">
          {{ label() }}
          @if (required()) {
            <span class="text-error ml-0.5" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="relative flex items-center">
        <input
          [id]="inputId"
          [type]="resolvedType()"
          [placeholder]="placeholder()"
          [autocomplete]="autocomplete()"
          [disabled]="isDisabled()"
          [value]="value()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-required]="required() || null"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="w-full rounded border bg-surface px-3 py-2 text-sm text-text-primary
                 placeholder:text-text-muted transition-colors duration-150
                 focus:outline-none focus:ring-2 focus:ring-offset-0
                 disabled:bg-surface-subtle disabled:cursor-not-allowed disabled:text-text-muted"
          [class]="inputStateClasses()"
        />

        @if (type() === 'password') {
          <button
            type="button"
            (click)="togglePasswordVisibility()"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            class="flex absolute right-3 top-1/2 -translate-y-1/2 text-text-muted
                   hover:text-text-secondary transition-colors"
          >
            @if (showPassword()) {
              <span class="material-icons text-[18px] leading-none" aria-hidden="true"
                >visibility_off</span
              >
            } @else {
              <span class="material-icons text-[18px] leading-none" aria-hidden="true"
                >visibility</span
              >
            }
          </button>
        }
      </div>

      @if (error()) {
        <p [id]="errorId" class="text-xs text-error" aria-live="polite">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p [id]="hintId" class="text-xs text-text-muted">
          {{ hint() }}
        </p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor, OnInit {
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  hint = input<string>('');
  error = input<string | null | undefined>(null);
  autocomplete = input<string>('off');
  required = input<boolean>(false);

  protected inputId = `eb-input-${++idCounter}`;
  protected errorId = `${this.inputId}-error`;
  protected hintId = `${this.inputId}-hint`;

  protected value = signal('');
  protected isDisabled = signal(false);
  protected showPassword = signal(false);

  protected resolvedType = computed(() =>
    this.type() === 'password' && this.showPassword() ? 'text' : this.type(),
  );

  protected inputStateClasses = computed(() =>
    this.error()
      ? 'border-error focus:ring-error'
      : 'border-border focus:ring-primary-600 focus:border-primary-600',
  );

  protected ariaDescribedBy = computed(() => {
    if (this.error()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  ngOnInit(): void {}

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }
}
