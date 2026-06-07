import { Component, ChangeDetectionStrategy, inject, input, signal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AccountsService } from '../accounts.service';
import { CardComponent } from '../../../shared/components/card/card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { Account, Transaction, PaginatedResponse } from '../../../shared/models';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

const TYPE_LABEL: Record<Account['type'], string> = {
  current: 'Current Account',
  savings: 'Savings Account',
  credit: 'Credit Account',
};

const TYPE_ICON: Record<Account['type'], string> = {
  current: 'account_balance',
  savings: 'savings',
  credit: 'credit_card',
};

const ICON_BG: Record<Account['type'], string> = {
  current: 'p-3 bg-primary-50 rounded-xl',
  savings: 'p-3 bg-success-light rounded-xl',
  credit: 'p-3 bg-warning-light rounded-xl',
};

const ICON_COLOR: Record<Account['type'], string> = {
  current: 'text-primary-600',
  savings: 'text-success',
  credit: 'text-warning',
};

@Component({
  selector: 'app-account-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    CardComponent,
    SkeletonComponent,
    BadgeComponent,
    AlertComponent,
  ],
  template: `
    <div class="animate-fade-in">
      <a
        routerLink="/accounts"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-600 mb-6 transition-colors"
      >
        <span class="material-icons text-[18px] leading-none" aria-hidden="true">arrow_back</span>
        Back to accounts
      </a>

      @if (account.isLoading()) {
        <eb-card class="mb-6 block">
          <div class="flex items-center gap-4 mb-4">
            <eb-skeleton variant="rect" width="3rem" height="3rem" />
            <div class="flex-1 space-y-2">
              <eb-skeleton height="1.25rem" width="50%" />
              <eb-skeleton height="0.875rem" width="30%" />
            </div>
          </div>
          <eb-skeleton height="2.5rem" width="40%" class="mb-2 block" />
          <eb-skeleton height="0.875rem" width="25%" />
        </eb-card>
      } @else if (account.error()) {
        <eb-alert
          type="error"
          message="Account not found or could not be loaded."
          class="mb-6 block"
        />
      } @else if (account.value(); as acc) {
        <eb-card class="mb-6 block">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div [class]="iconBg(acc.type)">
                <span
                  class="material-icons text-[28px] leading-none"
                  [class]="iconColor(acc.type)"
                  aria-hidden="true"
                  >{{ typeIcon(acc.type) }}</span
                >
              </div>
              <div>
                <h1 class="text-xl font-bold text-text-primary">{{ typeLabel(acc.type) }}</h1>
                <p class="text-sm text-text-muted font-mono mt-0.5">{{ acc.accountNumber }}</p>
              </div>
            </div>
            <eb-badge [variant]="accountStatusVariant(acc.status)">{{
              acc.status | titlecase
            }}</eb-badge>
          </div>

          <div class="mt-6 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p class="text-xs text-text-secondary mb-1">Balance</p>
              <p
                [class]="
                  acc.balance < 0
                    ? 'text-error text-3xl font-bold tabular-nums'
                    : 'text-text-primary text-3xl font-bold tabular-nums'
                "
              >
                {{ acc.balance | currency: acc.currency : 'symbol' : '1.2-2' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">Available</p>
              <p class="text-xl font-semibold text-text-primary tabular-nums">
                {{ acc.availableBalance | currency: acc.currency : 'symbol' : '1.2-2' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">Currency</p>
              <p class="text-xl font-semibold text-text-primary">{{ acc.currency }}</p>
            </div>
          </div>
        </eb-card>
      }

      @if (!account.error()) {
        <eb-card padding="none">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-base font-semibold text-text-primary">Transactions</h2>
            <button
              type="button"
              (click)="toggleSort()"
              class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <span class="material-icons text-[16px] leading-none" aria-hidden="true">{{
                sortOrder() === 'desc' ? 'arrow_downward' : 'arrow_upward'
              }}</span>
              {{ sortOrder() === 'desc' ? 'Newest first' : 'Oldest first' }}
            </button>
          </div>

          @if (txns.isLoading()) {
            <div class="p-6 space-y-3">
              @for (_ of [1, 2, 3, 4, 5]; track $index) {
                <eb-skeleton height="1.25rem" />
              }
            </div>
          } @else if (txns.error()) {
            <div class="p-6"><eb-alert type="error" message="Could not load transactions." /></div>
          } @else if (txns.value(); as result) {
            @if (result.data.length === 0) {
              <div class="px-6 py-12 text-center">
                <span
                  class="material-icons text-[40px] text-text-muted leading-none"
                  aria-hidden="true"
                  >receipt_long</span
                >
                <p class="mt-3 text-sm text-text-secondary">No transactions on this account.</p>
              </div>
            } @else {
              <div class="hidden sm:block overflow-x-auto">
                <table
                  class="w-full text-sm"
                  [attr.aria-label]="'Transactions for account ' + id()"
                >
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
                    @for (txn of result.data; track txn.id) {
                      <tr class="hover:bg-surface-muted transition-colors">
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
                          <eb-badge [variant]="txnTypeVariant(txn.type)">{{
                            txn.type | titlecase
                          }}</eb-badge>
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
                          <eb-badge [variant]="txnStatusVariant(txn.status)">{{
                            txn.status | titlecase
                          }}</eb-badge>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="sm:hidden divide-y divide-border">
                @for (txn of result.data; track txn.id) {
                  <div class="px-4 py-3 flex items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-text-primary truncate">
                        {{ txn.description }}
                      </p>
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
                      <eb-badge [variant]="txnStatusVariant(txn.status)" class="mt-1">{{
                        txn.status | titlecase
                      }}</eb-badge>
                    </div>
                  </div>
                }
              </div>

              @if (result.total > result.pageSize) {
                <div
                  class="px-6 py-4 border-t border-border flex items-center justify-between text-sm text-text-secondary"
                >
                  <span>{{ paginationLabel(result) }}</span>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="prevPage()"
                      [disabled]="currentPage() === 1"
                      class="px-3 py-1.5 rounded border border-border hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      (click)="nextPage(result.total)"
                      [disabled]="isLastPage(result.total)"
                      class="px-3 py-1.5 rounded border border-border hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              }
            }
          }
        </eb-card>
      }
    </div>
  `,
})
export class AccountDetailComponent {
  private accountsService = inject(AccountsService);

  id = input.required<string>();

  protected sortOrder = signal<'asc' | 'desc'>('desc');
  protected currentPage = signal(1);

  protected account = resource<Account, unknown>({
    loader: () => firstValueFrom(this.accountsService.getAccount(this.id())),
  });

  protected txns = resource<PaginatedResponse<Transaction>, unknown>({
    loader: () =>
      firstValueFrom(
        this.accountsService.getTransactions({
          accountId: this.id(),
          sort: 'date',
          order: this.sortOrder(),
          page: this.currentPage(),
          pageSize: 10,
        }),
      ),
  });

  protected toggleSort(): void {
    this.sortOrder.update((o) => (o === 'desc' ? 'asc' : 'desc'));
    this.currentPage.set(1);
  }

  protected prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }
  protected nextPage(total: number): void {
    if (!this.isLastPage(total)) this.currentPage.update((p) => p + 1);
  }
  protected isLastPage(total: number): boolean {
    return this.currentPage() * 10 >= total;
  }

  protected paginationLabel(result: PaginatedResponse<Transaction>): string {
    const from = (result.page - 1) * result.pageSize + 1;
    const to = Math.min(result.page * result.pageSize, result.total);
    return `${from}–${to} of ${result.total}`;
  }

  protected typeIcon(type: Account['type']): string {
    return TYPE_ICON[type];
  }
  protected typeLabel(type: Account['type']): string {
    return TYPE_LABEL[type];
  }
  protected iconBg(type: Account['type']): string {
    return ICON_BG[type];
  }
  protected iconColor(type: Account['type']): string {
    return ICON_COLOR[type];
  }

  protected accountStatusVariant(status: Account['status']): BadgeVariant {
    return { active: 'success', frozen: 'warning', closed: 'muted' }[status] as BadgeVariant;
  }

  protected txnTypeVariant(type: Transaction['type']): BadgeVariant {
    return { deposit: 'success', withdrawal: 'error', transfer: 'info' }[
      type
    ] as BadgeVariant;
  }

  protected txnStatusVariant(status: Transaction['status']): BadgeVariant {
    return { completed: 'success', pending: 'warning', failed: 'error' }[
      status
    ] as BadgeVariant;
  }
}
