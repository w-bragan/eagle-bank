import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { BadgeVariant, Transaction } from '../../models';

@Component({
  selector: 'eb-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, TitleCasePipe, BadgeComponent],
  template: `
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm" aria-label="Transactions">
        <thead>
          <tr class="border-b border-border bg-surface-muted">
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
            >
              Date
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
            >
              Description
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"
            >
              Amount
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          @for (txn of data(); track txn.id) {
            <tr
              class="hover:bg-surface-muted transition-colors"
              [class.cursor-pointer]="clickable()"
              [attr.tabindex]="clickable() ? 0 : null"
              (click)="handleClick(txn)"
              (keydown.enter)="handleClick(txn)"
            >
              <td class="px-6 py-4 whitespace-nowrap text-text-secondary tabular-nums">
                {{ txn.date | date: 'd MMM y' }}
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-text-primary">{{ txn.description }}</p>
                @if (txn.category) {
                  <p class="text-xs text-text-muted mt-0.5">{{ txn.category }}</p>
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <eb-badge [variant]="typeVariant(txn.type)">{{ txn.type | titlecase }}</eb-badge>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right font-semibold tabular-nums"
                [class.text-success]="txn.type === 'deposit'"
                [class.text-error]="txn.type !== 'deposit'"
              >
                {{ txn.type === 'deposit' ? '+' : '-'
                }}{{ txn.amount | currency: 'GBP' : 'symbol' : '1.2-2' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <eb-badge [variant]="statusVariant(txn.status)">{{
                  txn.status | titlecase
                }}</eb-badge>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="sm:hidden divide-y divide-border">
      @for (txn of data(); track txn.id) {
        <div
          class="px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-muted transition-colors"
          [class.cursor-pointer]="clickable()"
          [attr.tabindex]="clickable() ? 0 : null"
          (click)="handleClick(txn)"
          (keydown.enter)="handleClick(txn)"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-text-primary truncate">{{ txn.description }}</p>
            <p class="text-xs text-text-muted mt-0.5">{{ txn.date | date: 'd MMM y' }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p
              class="text-sm font-semibold tabular-nums"
              [class.text-success]="txn.type === 'deposit'"
              [class.text-error]="txn.type !== 'deposit'"
            >
              {{ txn.type === 'deposit' ? '+' : '-'
              }}{{ txn.amount | currency: 'GBP' : 'symbol' : '1.2-2' }}
            </p>
            <eb-badge [variant]="statusVariant(txn.status)" class="mt-1">{{
              txn.status | titlecase
            }}</eb-badge>
          </div>
        </div>
      }
    </div>
  `,
})
export class TableComponent {
  data = input.required<Transaction[]>();
  clickable = input<boolean>(false);

  rowClick = output<Transaction>();

  protected handleClick(txn: Transaction): void {
    if (this.clickable()) this.rowClick.emit(txn);
  }

  protected typeVariant(type: Transaction['type']): BadgeVariant {
    return { deposit: 'success', withdrawal: 'error', transfer: 'info' }[type] as BadgeVariant;
  }

  protected statusVariant(status: Transaction['status']): BadgeVariant {
    return { completed: 'success', pending: 'warning', failed: 'error' }[status] as BadgeVariant;
  }
}
