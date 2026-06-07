import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, Transaction, PaginatedResponse } from '../../shared/models';

export interface TransactionQuery {
  accountId?: string;
  sort?: 'date' | 'amount';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private http = inject(HttpClient);

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>('/api/accounts');
  }

  getAccount(id: string): Observable<Account> {
    return this.http.get<Account>(`/api/accounts/${id}`);
  }

  getTransactions(query: TransactionQuery = {}): Observable<PaginatedResponse<Transaction>> {
    let params = new HttpParams();
    if (query.accountId) params = params.set('accountId', query.accountId);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.order) params = params.set('order', query.order);
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    return this.http.get<PaginatedResponse<Transaction>>('/api/transactions', { params });
  }
}
