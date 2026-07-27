import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthUser } from '../models';
import { clearSession, getStoredUser, setStoredUser, setToken } from '../token';
import { ApiService } from './api.service';

export interface SessionUser {
  name: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

/**
 * Real auth against the JWC API: `/auth/login` returns a JWT, `/auth/register`
 * returns the created user. The token is the only thing the backend keeps —
 * the display name is cached locally (login only echoes back a token).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  readonly user = signal<SessionUser | null>(getStoredUser<SessionUser>());
  readonly isAuthenticated = computed(() => this.user() !== null);

  readonly initials = computed(() => {
    const name = this.user()?.name;
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  async login(email: string, password: string): Promise<void> {
    const { token } = await this.api.post<{ token: string }>('/auth/login', { email, password });
    setToken(token);
    // Keep the name from a prior register on this browser; otherwise derive it.
    const known = getStoredUser<SessionUser>();
    const user: SessionUser = {
      email,
      name: known?.email === email ? known.name : displayName(email),
    };
    setStoredUser(user);
    this.user.set(user);
  }

  async register(req: RegisterRequest): Promise<void> {
    const created = await this.api.post<AuthUser>('/auth/register', req);
    await this.login(req.email, req.password);
    const user: SessionUser = {
      email: created.email,
      name: `${created.first_name} ${created.last_name}`.trim(),
    };
    setStoredUser(user);
    this.user.set(user);
  }

  logout(): void {
    clearSession();
    this.user.set(null);
  }
}

function displayName(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
