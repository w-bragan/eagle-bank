import { Component, ChangeDetectionStrategy, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AccountsService } from './accounts.service';
import { CardComponent } from '../../shared/components/card/card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { Account, BadgeVariant } from '../../shared/models';

const TYPE_ICON: Record<Account['type'], string> = {
  current: 'account_balance',
  savings: 'savings',
  credit: 'credit_card',
};

const TYPE_LABEL: Record<Account['type'], string> = {
  current: 'Current Account',
  savings: 'Savings Account',
  credit: 'Credit Account',
};

const ICON_BG: Record<Account['type'], string> = {
  current: 'flex p-2.5 bg-primary-50 rounded-lg',
  savings: 'flex p-2.5 bg-success-light rounded-lg',
  credit: 'flex p-2.5 bg-warning-light rounded-lg',
};

const ICON_COLOR: Record<Account['type'], string> = {
  current: 'text-primary-600',
  savings: 'text-success',
  credit: 'text-warning',
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CurrencyPipe,
    TitleCasePipe,
    CardComponent,
    SkeletonComponent,
    BadgeComponent,
    AlertComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="animate-fade-in">
      <app-page-header title="Accounts" subtitle="Manage and view all your accounts." />

      @if (data.isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (_ of [1, 2, 3]; track $index) {
            <eb-card>
              <div class="flex items-center gap-3 mb-4">
                <eb-skeleton variant="rect" width="2.5rem" height="2.5rem" />
                <div class="flex-1"><eb-skeleton height="1rem" width="70%" /></div>
              </div>
              <eb-skeleton height="1.75rem" width="55%" class="mb-2 block" />
              <eb-skeleton height="0.75rem" width="40%" />
            </eb-card>
          }
        </div>

      } @else if (data.error()) {
        <eb-alert type="error" message="Could not load accounts. Please try again." />

      } @else if (data.value(); as accounts) {
        @if (accounts.length === 0) {
          <div class="text-center py-16">
            <span class="material-icons text-[48px] text-text-muted leading-none" aria-hidden="true"
              >account_balance</span
            >
            <p class="mt-3 text-text-secondary">No accounts found.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (account of accounts; track account.id) {
              <a
                [routerLink]="['/accounts', account.id]"
                class="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-lg"
              >
                <eb-card [hover]="true">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div [class]="iconBg(account.type)">
                        <span
                          class="material-icons text-[22px] leading-none"
                          [class]="iconColor(account.type)"
                          aria-hidden="true"
                          >{{ typeIcon(account.type) }}</span
                        >
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-text-primary">
                          {{ typeLabel(account.type) }}
                        </p>
                        <p class="text-xs text-text-muted font-mono">{{ account.accountNumber }}</p>
                      </div>
                    </div>
                    <eb-badge [variant]="statusVariant(account.status)">{{
                      account.status | titlecase
                    }}</eb-badge>
                  </div>

                  <p class="text-xs text-text-secondary mb-1">Balance</p>
                  <p
                    [class]="
                      account.balance < 0
                        ? 'text-error text-2xl font-bold tabular-nums'
                        : 'text-text-primary text-2xl font-bold tabular-nums'
                    "
                  >
                    {{ account.balance | currency: account.currency : 'symbol' : '1.2-2' }}
                  </p>

                  <div class="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <p class="text-xs text-text-muted">Available</p>
                      <p class="text-sm font-medium text-text-primary tabular-nums">
                        {{
                          account.availableBalance | currency: account.currency : 'symbol' : '1.2-2'
                        }}
                      </p>
                    </div>
                    <span
                      class="material-icons text-text-muted text-[20px] leading-none group-hover:text-primary-600 transition-colors"
                      aria-hidden="true"
                      >arrow_forward</span
                    >
                  </div>
                </eb-card>
              </a>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AccountsComponent {
  private accountsService = inject(AccountsService);

  protected data = resource<Account[], unknown>({
    loader: () => firstValueFrom(this.accountsService.getAccounts()),
  });

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

  protected statusVariant(status: Account['status']): BadgeVariant {
    return { active: 'success', frozen: 'warning', closed: 'muted' }[status] as BadgeVariant;
  }
}
