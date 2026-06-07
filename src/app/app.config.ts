import { ApplicationConfig, ErrorHandler, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEnGb from '@angular/common/locales/en-GB';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { mockApiInterceptor } from './core/mock/mock-api.interceptor';
import { GlobalErrorHandler } from './core/error/global-error-handler';

registerLocaleData(localeEnGb);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: LOCALE_ID, useValue: 'en-GB' },
  ],
};
