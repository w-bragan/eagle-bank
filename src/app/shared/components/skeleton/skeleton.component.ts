import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'eb-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-surface-subtle animate-pulse-muted"
      [class.rounded-full]="variant() === 'circle'"
      [class.rounded]="variant() !== 'circle'"
      [style.width]="width()"
      [style.height]="height()"
      aria-hidden="true"
    ></div>
  `,
})
export class SkeletonComponent {
  variant = input<'text' | 'circle' | 'rect'>('text');
  width = input<string>('100%');
  height = input<string>('1rem');
}
