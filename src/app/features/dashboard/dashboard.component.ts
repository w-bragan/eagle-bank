import { Component, ChangeDetectionStrategy, inject, computed, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { firstValueFrom, forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { CardComponent } from '../../shared/components/card/card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { Account, Transaction } from '../../shared/models';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

@Component({
  selector: 'app-dashboard',
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
    PageHeaderComponent,
  ],
  template: `
    <div class="animate-fade-in">
      <app-page-header [title]="greeting()" subtitle="Here's a summary of your accounts today." />

      @if (data.isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          @for (_ of [1, 2, 3]; track $index) {
            <eb-card>
              <eb-skeleton height="1rem" width="60%" />
              <eb-skeleton height="2rem" class="mt-3 block" />
              <eb-skeleton height="0.75rem" width="40%" class="mt-2 block" />
            </eb-card>
          }
        </div>
        <eb-card padding="none">
          <div class="p-6 border-b border-border">
            <eb-skeleton height="1.25rem" width="12rem" />
          </div>
          <div class="p-6 space-y-4">
            @for (_ of [1, 2, 3, 4, 5]; track $index) {
              <eb-skeleton height="1.25rem" />
            }
          </div>
        </eb-card>

      } @else if (data.error()) {
        <eb-alert type="error" message="Could not load dashboard. Please try again." />

      } @else if (data.value(); as d) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <eb-card>
            <div class="flex items-start justify-between">
              <p class="text-sm font-medium text-text-secondary">Total Balance</p>
              <div class="p-2 bg-primary-50 rounded-lg">
                <span
                  class="material-icons text-primary-600 text-[20px] leading-none"
                  aria-hidden="true"
                  >account_balance_wallet</span
                >
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold text-text-primary tabular-nums">
              {{ d.summary.totalBalance | currency: 'GBP' : 'symbol' : '1.2-2' }}
            </p>
            <p class="mt-1 text-xs text-text-muted">
              Across {{ d.accounts.length }} account{{ d.accounts.length === 1 ? '' : 's' }}
            </p>
          </eb-card>

          <eb-card>
            <div class="flex items-start justify-between">
              <p class="text-sm font-medium text-text-secondary">Monthly Deposits</p>
              <div class="p-2 bg-success-light rounded-lg">
                <span
                  class="material-icons text-success text-[20px] leading-none"
                  aria-hidden="true"
                  >arrow_upward</span
                >
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold text-success tabular-nums">
              {{ d.summary.monthlyDeposits | currency: 'GBP' : 'symbol' : '1.2-2' }}
            </p>
            <p class="mt-1 text-xs text-text-muted">This month</p>
          </eb-card>

          <eb-card>
            <div class="flex items-start justify-between">
              <p class="text-sm font-medium text-text-secondary">Monthly Outflows</p>
              <div class="p-2 bg-error-light rounded-lg">
                <span
                  class="material-icons text-error text-[20px] leading-none"
                  aria-hidden="true"
                  >arrow_downward</span
                >
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold text-error tabular-nums">
              {{ d.summary.monthlyWithdrawals | currency: 'GBP' : 'symbol' : '1.2-2' }}
            </p>
            <p class="mt-1 text-xs text-text-muted">This month</p>
          </eb-card>
        </div>

        <div class="flex gap-3 mb-8">
          <a
            routerLink="/accounts"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <span class="material-icons text-[18px] leading-none" aria-hidden="true"
              >credit_card</span
            >
            View Accounts
          </a>
          <a
            routerLink="/transactions"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm font-medium hover:bg-surface-subtle transition-colors"
          >
            <span class="material-icons text-[18px] leading-none" aria-hidden="true"
              >receipt_long</span
            >
            All Transactions
          </a>
        </div>

        <eb-card padding="none">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-base font-semibold text-text-primary">Recent Transactions</h2>
            <a
              routerLink="/transactions"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >View all</a
            >
          </div>

          @if (d.summary.recentTransactions.length === 0) {
            <div class="px-6 py-12 text-center">
              <p class="text-sm text-text-muted">No transactions yet.</p>
            </div>
          } @else {
            <div class="hidden sm:block overflow-x-auto">
              <table class="w-full text-sm" aria-label="Recent transactions">
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
                      Account
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
                  @for (txn of d.summary.recentTransactions; track txn.id) {
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
                      <td class="px-6 py-4 whitespace-nowrap text-text-secondary">
                        {{ accountLabel(txn, d.accounts) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <eb-badge [variant]="typeVariant(txn.type)">{{
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
              @for (txn of d.summary.recentTransactions; track txn.id) {
                <div class="px-4 py-3 flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-text-primary truncate">
                      {{ txn.description }}
                    </p>
                    <p class="text-xs text-text-muted mt-0.5">
                      {{ txn.date | date: 'd MMM y' }} · {{ accountLabel(txn, d.accounts) }}
                    </p>
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
          }
        </eb-card>
      }
    </div>
  `,
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);

  protected data = resource({
    loader: () =>
      firstValueFrom(
        forkJoin({
          summary: this.dashboardService.getSummary(),
          accounts: this.dashboardService.getAccounts(),
        }),
      ),
  });

  protected greeting = computed(() => {
    const name = this.auth.user()?.name?.split(' ')[0] ?? 'there';
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${salutation}, ${name}`;
  });

  protected accountLabel(txn: Transaction, accounts: Account[]): string {
    const acc = accounts.find((a) => a.id === txn.accountId);
    return acc
      ? `${acc.type.charAt(0).toUpperCase() + acc.type.slice(1)} ••${acc.accountNumber.slice(-4)}`
      : '—';
  }

  protected typeVariant(type: Transaction['type']): BadgeVariant {
    return { deposit: 'success', withdrawal: 'error', transfer: 'info' }[
      type
    ] as BadgeVariant;
  }

  protected statusVariant(status: Transaction['status']): BadgeVariant {
    return { completed: 'success', pending: 'warning', failed: 'error' }[
      status
    ] as BadgeVariant;
  }
}
