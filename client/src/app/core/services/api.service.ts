import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Thin promise-based wrapper over HttpClient for the MyWallet API. Feature
 * services stay declarative; components keep the async/await style the
 * template already uses.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    return this.run(this.http.get<T>(this.url(path), { params: this.params(params) }));
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.run(this.http.post<T>(this.url(path), body));
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.run(this.http.patch<T>(this.url(path), body));
  }

  delete(path: string): Promise<void> {
    return this.run(this.http.delete<void>(this.url(path)));
  }

  private url(path: string): string {
    return `${environment.apiUrl}${path}`;
  }

  private params(source?: Record<string, string | number>): HttpParams | undefined {
    if (!source) {
      return undefined;
    }
    let params = new HttpParams();
    for (const [key, value] of Object.entries(source)) {
      params = params.set(key, String(value));
    }
    return params;
  }

  private async run<T>(source: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(source);
    } catch (e) {
      throw new ApiRequestError(apiError(e));
    }
  }
}

/**
 * Thrown by every ApiService call. `.message` stays the human-readable string
 * callers already display; `.code` / `.details` are there when a caller wants
 * to branch on the failure instead of just showing it.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, string>;

  constructor(envelope: ApiError) {
    super(envelope.error);
    this.name = 'ApiRequestError';
    this.status = envelope.status;
    this.code = envelope.code;
    this.details = envelope.details;
  }
}

/**
 * The single error envelope every JWC endpoint returns since 0.7.0. `code` is
 * the stable contract to branch on; `details` carries per-field validation
 * messages (it was called `errors` before 0.7.0).
 */
export interface ApiError {
  error: string;
  status: number;
  code: ApiErrorCode;
  /** One rule per field, e.g. `{ password: "minLength(8)" }`. */
  details?: Record<string, string>;
}

export type ApiErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'method_not_allowed'
  | 'timeout'
  | 'internal_error'
  /** Not a runtime code — returned by RateLimitMiddleware, not the runtime. */
  | 'rate_limited';

/** Unwraps the JWC error envelope into a plain message. */
export function apiErrorMessage(e: unknown): string {
  return apiError(e).error;
}

/**
 * Normalises anything thrown by HttpClient into the envelope shape. A single
 * branch is enough now that the server no longer returns three different bodies
 * — the fallbacks below only cover errors that never reached the API (status 0)
 * or a non-JWC proxy in front of it.
 */
export function apiError(e: unknown): ApiError {
  if (e instanceof HttpErrorResponse) {
    const body = e.error as Partial<ApiError> | null;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      return {
        error: body.error,
        status: body.status ?? e.status,
        code: body.code ?? 'internal_error',
        details: body.details,
      };
    }
    if (e.status === 0) {
      return { error: 'API unreachable — is the JWC server running?', status: 0, code: 'internal_error' };
    }
    return { error: `Request failed (${e.status})`, status: e.status, code: 'internal_error' };
  }
  const message = e instanceof Error ? e.message : 'Unexpected error';
  return { error: message, status: 0, code: 'internal_error' };
}

/** Flattens `details` into one line per failed field, for form-level display. */
export function validationMessages(e: unknown): string[] {
  const err = apiError(e);
  if (err.code !== 'validation_failed' || !err.details) {
    return [];
  }
  return Object.entries(err.details).map(([field, rule]) => `${field}: ${rule}`);
}
