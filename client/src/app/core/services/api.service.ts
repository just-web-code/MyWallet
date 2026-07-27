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
      throw new Error(apiErrorMessage(e));
    }
  }
}

/** Unwraps the JWC error envelope (`{ error: "..." }`) into a plain message. */
export function apiErrorMessage(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const body = e.error as { error?: string; message?: string } | string | null;
    if (typeof body === 'string' && body) {
      return body;
    }
    if (body && typeof body === 'object' && (body.error || body.message)) {
      return (body.error ?? body.message) as string;
    }
    if (e.status === 0) {
      return 'API unreachable — is the JWC server running?';
    }
    return `Request failed (${e.status})`;
  }
  return e instanceof Error ? e.message : 'Unexpected error';
}
