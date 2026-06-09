import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Accounts', path: '/accounts', icon: 'credit_card' },
  { label: 'Transactions', path: '/transactions', icon: 'receipt_long' },
  { label: 'Profile', path: '/profile', icon: 'person' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ModalComponent],
  template: `
    @if (mobileOpen()) {
      <div
        class="fixed inset-0 bg-black/40 z-20 lg:hidden"
        (click)="mobileOpen.set(false)"
        aria-hidden="true"
      ></div>
    }

    <div class="flex h-screen overflow-hidden bg-surface-muted">
      <aside [class]="sidebarClass()" aria-label="Main navigation">
        <div class="flex items-center h-16 px-6 border-b border-border flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div
              class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-white text-[18px] leading-none" aria-hidden="true"
                >account_balance</span
              >
            </div>
            <span class="text-base font-bold text-text-primary tracking-tight">Eagle Bank</span>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-3">
          <ul role="list" class="space-y-1">
            @for (item of navItems; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-primary-50 text-primary-700 font-medium"
                  [routerLinkActiveOptions]="{ exact: false }"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
                  (click)="mobileOpen.set(false)"
                >
                  <span
                    class="material-icons text-[20px] leading-none flex-shrink-0"
                    aria-hidden="true"
                    >{{ item.icon }}</span
                  >
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="flex-shrink-0 border-t border-border p-4">
          <div class="flex items-center gap-3 mb-3">
            <button
              type="button"
              (click)="additionsOpen.set(true)"
              class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 hover:bg-primary-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              aria-label="Open additions panel"
            >
              {{ userInitials() }}
            </button>
            <div class="min-w-0">
              <p class="text-sm font-medium text-text-primary truncate">{{ userName() }}</p>
              <p class="text-xs text-text-muted truncate">{{ userEmail() }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="logout()"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error-light rounded-lg transition-colors"
          >
            <span class="material-icons text-[18px] leading-none flex-shrink-0" aria-hidden="true"
              >logout</span
            >
            Sign out
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          class="lg:hidden flex items-center justify-between h-16 px-4 bg-surface border-b border-border flex-shrink-0"
        >
          <button
            type="button"
            (click)="mobileOpen.set(true)"
            class="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            aria-label="Open navigation menu"
          >
            <span class="material-icons text-[22px] leading-none" aria-hidden="true">menu</span>
          </button>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span class="material-icons text-white text-[14px] leading-none" aria-hidden="true"
                >account_balance</span
              >
            </div>
            <span class="text-sm font-bold text-text-primary">Eagle Bank</span>
          </div>
          <div class="w-9"></div>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <eb-modal [open]="additionsOpen()" ariaLabel="Additions" (closed)="additionsOpen.set(false)">
      <div ebModalTitle class="flex items-center gap-3">
        <span class="text-base font-semibold text-text-primary">Additions</span>
      </div>
      <div ebModalContent class="space-y-2">
        <li class="flex items-start gap-3">Dark mode</li>
        <li class="flex items-start gap-3">Toast/snackbar notifications</li>
        <li class="flex items-start gap-3">Spending chart on dashboard</li>
        <li class="flex items-start gap-3">Storybook Integration</li>
        <li class="flex items-start gap-3">E2E suite (Playwright/Cypress)</li>
      </div>
    </eb-modal>
  `,
})
export class ShellComponent {
  private auth = inject(AuthService);

  protected navItems = NAV_ITEMS;
  protected mobileOpen = signal(false);
  protected additionsOpen = signal(false);

  protected userName = computed(() => this.auth.user()?.name ?? '');
  protected userEmail = computed(() => this.auth.user()?.email ?? '');
  protected userInitials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return (
      name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || '?'
    );
  });

  protected sidebarClass = computed(() => {
    const base = 'flex flex-col w-64 bg-surface border-r border-border flex-shrink-0 z-30';
    const mobile = this.mobileOpen()
      ? 'fixed inset-y-0 left-0 translate-x-0'
      : 'fixed inset-y-0 left-0 -translate-x-full';
    return `${base} transition-transform duration-200 ${mobile} lg:relative lg:translate-x-0`;
  });

  protected logout(): void {
    this.auth.logout();
  }
}
