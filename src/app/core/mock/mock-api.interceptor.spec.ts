import { HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { mockApiInterceptor } from './mock-api.interceptor';

const VALID_TOKEN = btoa(JSON.stringify({ id: '1', exp: 9_999_999_999_999 }));

function makeReq(method: string, url: string, body: unknown = null, withAuth = false): HttpRequest<unknown> {
  const headers = withAuth
    ? new HttpHeaders({ Authorization: `Bearer ${VALID_TOKEN}` })
    : new HttpHeaders();
  const bodyless = ['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(method.toUpperCase());
  if (bodyless) {
    return new HttpRequest(method, url, { headers }) as unknown as HttpRequest<unknown>;
  }
  return new HttpRequest(method, url, body, { headers }) as unknown as HttpRequest<unknown>;
}

function call(request: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  return mockApiInterceptor(request, () => {
    throw new Error(`Unhandled: ${request.urlWithParams}`);
  }) as Observable<HttpResponse<unknown>>;
}

describe('mockApiInterceptor', () => {
  describe('POST /api/auth/login', () => {
    it('returns a token and user object for valid credentials', async () => {
      const res = await firstValueFrom(
        call(makeReq('POST', '/api/auth/login', { email: 'jane@eaglebank.com', password: 'Password123!' })),
      );
      const body = res.body as Record<string, unknown>;
      expect(body['token']).toBeTruthy();
      expect((body['user'] as Record<string, unknown>)['email']).toBe('jane@eaglebank.com');
      expect((body['user'] as Record<string, unknown>)['password']).toBeUndefined();
    });

    it('returns 401 for invalid credentials', async () => {
      await expect(
        firstValueFrom(call(makeReq('POST', '/api/auth/login', { email: 'bad@test.com', password: 'nope' }))),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('GET /api/accounts', () => {
    it('returns all accounts for an authenticated request', async () => {
      const res = await firstValueFrom(call(makeReq('GET', '/api/accounts', null, true)));
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as unknown[]).length).toBeGreaterThan(0);
    });

    it('returns 401 when no auth token is provided', async () => {
      await expect(firstValueFrom(call(makeReq('GET', '/api/accounts')))).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('returns the account matching the given id', async () => {
      const res = await firstValueFrom(call(makeReq('GET', '/api/accounts/1', null, true)));
      expect((res.body as Record<string, unknown>)['id']).toBe('1');
    });

    it('returns 404 for an unknown account id', async () => {
      await expect(
        firstValueFrom(call(makeReq('GET', '/api/accounts/does-not-exist', null, true))),
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('GET /api/transactions', () => {
    it('returns a paginated response', async () => {
      const res = await firstValueFrom(call(makeReq('GET', '/api/transactions', null, true)));
      expect(res.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        pageSize: 10,
      });
    });

    it('filters results by accountId query param', async () => {
      const res = await firstValueFrom(
        call(makeReq('GET', '/api/transactions?accountId=acc1', null, true)),
      );
      const data = (res.body as Record<string, unknown>)['data'] as Array<Record<string, unknown>>;
      expect(data.every((t) => t['accountId'] === 'acc1')).toBe(true);
    });

    it('respects the pageSize query param', async () => {
      const res = await firstValueFrom(
        call(makeReq('GET', '/api/transactions?page=1&pageSize=2', null, true)),
      );
      const body = res.body as Record<string, unknown>;
      expect(body['pageSize']).toBe(2);
      expect((body['data'] as unknown[]).length).toBeLessThanOrEqual(2);
    });
  });
}, 10_000);

