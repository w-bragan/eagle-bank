import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  booleanAttribute,
} from '@angular/core';

@Component({
  selector: 'eb-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [class]="cls()"><ng-content /></div>`,
})
export class CardComponent {
  padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
  hover = input(false, { transform: booleanAttribute });

  protected cls = computed(() => {
    const pad = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }[this.padding()];
    const hov = this.hover() ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
    return `bg-surface rounded-lg border border-border shadow-card ${pad} ${hov}`.trim();
  });
}
