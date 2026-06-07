import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, PaginatedResponse } from '../../shared/models';
import { TransactionQuery } from '../accounts/accounts.service';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);

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
