import { Component, ChangeDetectionStrategy, input, output, HostListener } from '@angular/core';

@Component({
  selector: 'eb-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel()"
      >
        <div class="absolute inset-0 bg-black/50" (click)="closed.emit()" aria-hidden="true"></div>
        <div class="relative z-10 w-full max-w-lg bg-surface rounded-xl shadow-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <ng-content select="[ebModalTitle]" />
            <button
              type="button"
              (click)="closed.emit()"
              class="ml-4 flex flex-shrink-0 p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
              aria-label="Close modal"
            >
              <span class="material-icons text-[20px] leading-none" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="px-6 py-5">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  open = input<boolean>(false);
  ariaLabel = input<string>('Modal');

  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }
}
