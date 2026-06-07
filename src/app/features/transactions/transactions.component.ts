import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>TransactionsComponent</p>`,
})
export class TransactionsComponent {}
