import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is created', () => expect(service).toBeTruthy());

  describe('getAccounts()', () => {
    it('sends GET /api/accounts', () => {
      service.getAccounts().subscribe();
      const req = http.expectOne('/api/accounts');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getAccount(id)', () => {
    it('sends GET /api/accounts/:id', () => {
      service.getAccount('acc1').subscribe();
      const req = http.expectOne('/api/accounts/acc1');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getTransactions(query)', () => {
    it('sends GET /api/transactions with no params when called with defaults', () => {
      service.getTransactions().subscribe();
      const req = http.expectOne('/api/transactions');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], total: 0, page: 1, pageSize: 10 });
    });

    it('appends accountId when provided', () => {
      service.getTransactions({ accountId: 'acc1' }).subscribe();
      const req = http.expectOne((r) => r.url === '/api/transactions');
      expect(req.request.params.get('accountId')).toBe('acc1');
      req.flush({ data: [], total: 0, page: 1, pageSize: 10 });
    });

    it('appends sort, order, page and pageSize when provided', () => {
      service.getTransactions({ sort: 'date', order: 'asc', page: 2, pageSize: 5 }).subscribe();
      const req = http.expectOne((r) => r.url === '/api/transactions');
      expect(req.request.params.get('sort')).toBe('date');
      expect(req.request.params.get('order')).toBe('asc');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('5');
      req.flush({ data: [], total: 0, page: 2, pageSize: 5 });
    });

    it('appends from and to date range params when provided', () => {
      service.getTransactions({ from: '2026-06-01', to: '2026-06-30' }).subscribe();
      const req = http.expectOne((r) => r.url === '/api/transactions');
      expect(req.request.params.get('from')).toBe('2026-06-01');
      expect(req.request.params.get('to')).toBe('2026-06-30');
      req.flush({ data: [], total: 0, page: 1, pageSize: 10 });
    });
  });
});
