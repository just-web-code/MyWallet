import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { clearSession, getToken } from '../token';

/**
 * Attaches `Authorization: Bearer <jwt>` to API calls and drops the session on
 * a 401 (the JWC AuthMiddleware answers 401 for a missing/expired token).
 * The i18n loader also goes through HttpClient, so only API URLs are touched.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = getToken();

  const authed =
    token && req.url.startsWith('/api')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
        clearSession();
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
