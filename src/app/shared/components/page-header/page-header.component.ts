import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-text-primary">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="mt-1 text-sm text-text-secondary">{{ subtitle() }}</p>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}
