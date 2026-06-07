import {
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { of, throwError, delay } from 'rxjs';
import { MOCK_USERS, MOCK_ACCOUNTS, MOCK_TRANSACTIONS } from './data/mock-data';
import { DashboardSummary, PaginatedResponse, Transaction } from '../../shared/models';

const SIMULATE_DELAY_MS = 500;

function ok<T>(body: T) {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(SIMULATE_DELAY_MS));
}

function err(status: number, message: string) {
  return throwError(() => new HttpErrorResponse({ status, error: { message } }));
}

function parseToken(req: HttpRequest<unknown>): string | null {
  const auth = req.headers.get('Authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

function getUserFromToken(token: string | null) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null;
    return MOCK_USERS.find((u) => u.id === payload.id) ?? null;
  } catch {
    return null;
  }
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const { method, url } = req;

  // /api/auth/login
  if (method === 'POST' && url.endsWith('/api/auth/login')) {
    const { email, password } = req.body as Record<string, string>;
    const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!user) return err(401, 'Invalid email or password.');
    const { password: _, ...safeUser } = user;
    const token = btoa(JSON.stringify({ id: user.id, exp: Date.now() + 3_600_000 }));
    return ok({ token, user: safeUser });
  }

  // /api/auth/register
  if (method === 'POST' && url.endsWith('/api/auth/register')) {
    const body = req.body as Record<string, string>;
    if (MOCK_USERS.some((u) => u.email === body['email'])) {
      return err(409, 'An account with this email already exists.');
    }
    const newUser = {
      id: `u${Date.now()}`,
      name: body['name'],
      email: body['email'],
      password: body['password'],
    };
    MOCK_USERS.push(newUser);
    const { password: _, ...safeUser } = newUser;
    const token = btoa(JSON.stringify({ id: newUser.id, exp: Date.now() + 3_600_000 }));
    return ok({ token, user: safeUser });
  }

  // /api/auth/logout
  if (method === 'POST' && url.endsWith('/api/auth/logout')) {
    return ok({ success: true });
  }

  // /api/auth/me
  if (method === 'GET' && url.endsWith('/api/auth/me')) {
    const user = getUserFromToken(parseToken(req));
    if (!user) return err(401, 'Unauthorised.');
    const { password: _, ...safeUser } = user;
    return ok({ user: safeUser });
  }

  // /api/dashboard
  if (method === 'GET' && url.endsWith('/api/dashboard')) {
    if (!getUserFromToken(parseToken(req))) return err(401, 'Unauthorised.');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthly = MOCK_TRANSACTIONS.filter((t) => t.date >= monthStart);
    const summary: DashboardSummary = {
      totalBalance: MOCK_ACCOUNTS.reduce((s, a) => s + a.balance, 0),
      monthlyDeposits: monthly
        .filter((t) => t.type === 'deposit')
        .reduce((s, t) => s + t.amount, 0),
      monthlyWithdrawals: monthly
        .filter((t) => t.type !== 'deposit')
        .reduce((s, t) => s + t.amount, 0),
      recentTransactions: [...MOCK_TRANSACTIONS]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    };
    return ok(summary);
  }

  // /api/accounts
  if (method === 'GET' && url.endsWith('/api/accounts')) {
    if (!getUserFromToken(parseToken(req))) return err(401, 'Unauthorised.');
    return ok(MOCK_ACCOUNTS);
  }

  // /api/accounts/:id
  if (method === 'GET' && url.match(/\/api\/accounts\/[\w-]+$/)) {
    if (!getUserFromToken(parseToken(req))) return err(401, 'Unauthorised.');
    const id = url.split('/').at(-1);
    const account = MOCK_ACCOUNTS.find((a) => a.id === id);
    return account ? ok(account) : err(404, 'Account not found.');
  }

  // /api/transactions ───────────────────────────────────────────────────
  if (method === 'GET' && url.match(/\/api\/transactions(\?.*)?$/)) {
    if (!getUserFromToken(parseToken(req))) return err(401, 'Unauthorised.');
    const params = new URL(url, 'http://localhost').searchParams;
    let txns = [...MOCK_TRANSACTIONS];

    const from = params.get('from');
    const to = params.get('to');
    const accountId = params.get('accountId');
    const sort = params.get('sort') ?? 'date';
    const order = params.get('order') ?? 'desc';
    const page = parseInt(params.get('page') ?? '1', 10);
    const pageSize = parseInt(params.get('pageSize') ?? '10', 10);

    if (accountId) txns = txns.filter((t) => t.accountId === accountId);
    if (from) txns = txns.filter((t) => t.date >= from);
    if (to) txns = txns.filter((t) => t.date <= to);

    txns.sort((a, b) => {
      const va = sort === 'amount' ? a.amount : a.date;
      const vb = sort === 'amount' ? b.amount : b.date;
      return order === 'asc' ? (va < vb ? -1 : 1) : va > vb ? -1 : 1;
    });

    const total = txns.length;
    const data = txns.slice((page - 1) * pageSize, page * pageSize);
    const response: PaginatedResponse<Transaction> = { data, total, page, pageSize };
    return ok(response);
  }

  // /api/transactions/:id
  if (method === 'GET' && url.match(/\/api\/transactions\/[\w-]+$/)) {
    if (!getUserFromToken(parseToken(req))) return err(401, 'Unauthorised.');
    const id = url.split('/').at(-1);
    const txn = MOCK_TRANSACTIONS.find((t) => t.id === id);
    return txn ? ok(txn) : err(404, 'Transaction not found.');
  }

  // /api/profile
  if (method === 'GET' && url.endsWith('/api/profile')) {
    const user = getUserFromToken(parseToken(req));
    if (!user) return err(401, 'Unauthorised.');
    const { password: _, ...safeUser } = user;
    return ok(safeUser);
  }

  // /api/profile
  if (method === 'PUT' && url.endsWith('/api/profile')) {
    const user = getUserFromToken(parseToken(req));
    if (!user) return err(401, 'Unauthorised.');
    const updates = req.body as Partial<typeof user>;
    Object.assign(user, updates);
    const { password: _, ...safeUser } = user;
    return ok(safeUser);
  }

  return next(req);
};
