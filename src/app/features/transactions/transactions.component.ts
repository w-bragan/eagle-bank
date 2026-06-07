import { Component, ChangeDetectionStrategy, inject, signal, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TransactionDetailComponent } from '../../shared/components/transaction-detail/transaction-detail.component';
import { Transaction, PaginatedResponse } from '../../shared/models';
import { TransactionsService } from './transactions.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, CardComponent, SkeletonComponent, AlertComponent, PageHeaderComponent, TableComponent, ModalComponent, TransactionDetailComponent],
  template: `
    <div class="animate-fade-in">
      <app-page-header title="Transactions" subtitle="View all your transactions." />

      <eb-card padding="none">
        <div class="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 class="text-base font-semibold text-text-primary">All Transactions</h2>
          <button type="button" (click)="toggleSort()" class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <span class="material-icons text-[16px] leading-none" aria-hidden="true">{{ sortOrder() === 'desc' ? 'arrow_downward' : 'arrow_upward' }}</span>
            {{ sortOrder() === 'desc' ? 'Newest first' : 'Oldest first' }}
          </button>
        </div>

        @if (data.isLoading()) {
          <div class="p-6 space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) { <eb-skeleton height="1.25rem" /> }
          </div>
        } @else if (data.error()) {
          <div class="p-6"><eb-alert type="error" message="Could not load transactions. Please try again." /></div>
        } @else if (data.value(); as result) {
          @if (result.data.length === 0) {
            <div class="px-6 py-12 text-center">
              <span class="material-icons text-[40px] text-text-muted leading-none" aria-hidden="true">receipt_long</span>
              <p class="mt-3 text-sm text-text-secondary">No transactions found.</p>
            </div>
          } @else {
            <eb-table [data]="result.data" [clickable]="true" (rowClick)="openModal($event)" />

            @if (result.total > result.pageSize) {
              <div class="px-6 py-4 border-t border-border flex items-center justify-between text-sm text-text-secondary">
                <span>{{ paginationLabel(result) }}</span>
                <div class="flex gap-2">
                  <button type="button" (click)="prevPage()" [disabled]="currentPage() === 1" class="px-3 py-1.5 rounded border border-border hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                  <button type="button" (click)="nextPage(result.total)" [disabled]="isLastPage(result.total)" class="px-3 py-1.5 rounded border border-border hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                </div>
              </div>
            }
          }
        }
      </eb-card>

      <eb-modal [open]="!!selectedTxn()" ariaLabel="Transaction detail" (closed)="closeModal()">
        <div ebModalTitle class="flex items-center gap-4">
          <span class="material-icons text-[24px] text-text-secondary leading-none" aria-hidden="true">receipt_long</span>
          <div>
            <p class="text-sm font-medium text-text-primary">{{ selectedTxn()?.description }}</p>
            <p class="text-sm text-text-secondary">{{ selectedTxn()?.date | date:'mediumDate' }}</p>
          </div>
        </div>
        @if (selectedTxn(); as txn) {
          <eb-transaction-detail [transaction]="txn" />
        }
      </eb-modal>
    </div>
  `,
})
export class TransactionsComponent {
  private transactionsService = inject(TransactionsService);

  protected sortOrder    = signal<'asc' | 'desc'>('desc');
  protected currentPage  = signal(1);
  protected selectedTxn  = signal<Transaction | null>(null);

  protected data = resource<PaginatedResponse<Transaction>, unknown>({
    loader: () => firstValueFrom(
      this.transactionsService.getTransactions({ sort: 'date', order: this.sortOrder(), page: this.currentPage(), pageSize: 20 })
    ),
  });

  protected openModal(txn: Transaction): void  { this.selectedTxn.set(txn); }
  protected closeModal(): void                  { this.selectedTxn.set(null); }

  protected toggleSort(): void {
    this.sortOrder.update(o => o === 'desc' ? 'asc' : 'desc');
    this.currentPage.set(1);
  }

  protected prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  protected nextPage(total: number): void { if (!this.isLastPage(total)) this.currentPage.update(p => p + 1); }
  protected isLastPage(total: number): boolean { return this.currentPage() * 20 >= total; }

  protected paginationLabel(result: PaginatedResponse<Transaction>): string {
    const from = (result.page - 1) * result.pageSize + 1;
    const to   = Math.min(result.page * result.pageSize, result.total);
    return `${from}–${to} of ${result.total}`;
  }
}
