import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { BadgeVariant, Transaction } from '../../models';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'eb-transaction-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, BadgeComponent, TitleCasePipe],
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-text-secondary">Description</p>
          <p class="text-base font-medium text-text-primary">{{ transaction().description }}</p>
        </div>
        <div>
          <p class="text-sm text-text-secondary">Amount</p>
          <p class="text-base font-medium text-text-primary">
            {{ transaction().amount | currency: 'GBP' : 'symbol' : '1.2-2' }}
          </p>
        </div>
        <div>
          <p class="text-sm text-text-secondary">Reference</p>
          <p class="text-base font-medium text-text-primary">
            {{ transaction().reference }}
          </p>
        </div>
        <div>
          <p class="text-sm text-text-secondary">Category</p>
          <p class="text-base font-medium text-text-primary">{{ transaction().category }}</p>
        </div>
        <div>
          <p class="text-sm text-text-secondary">Type</p>
          <eb-badge [variant]="typeVariant(transaction().type)" class="mt-1">{{
            transaction().type | titlecase
          }}</eb-badge>
        </div>
        <div>
          <p class="text-sm text-text-secondary">Status</p>
          <eb-badge [variant]="statusVariant(transaction().status)" class="mt-1">{{
            transaction().status | titlecase
          }}</eb-badge>
        </div>
      </div>
    </div>
  `,
})
export class TransactionDetailComponent {
  transaction = input.required<Transaction>();

  protected typeVariant(type: Transaction['type']): BadgeVariant {
    return { deposit: 'success', withdrawal: 'error', transfer: 'info' }[type] as BadgeVariant;
  }

  protected statusVariant(status: Transaction['status']): BadgeVariant {
    return { completed: 'success', pending: 'warning', failed: 'error' }[status] as BadgeVariant;
  }
}
