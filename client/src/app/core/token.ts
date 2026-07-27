/**
 * JWT storage. Kept outside AuthService so the HTTP interceptor can read the
 * token without injecting the service (which itself depends on HttpClient).
 */
const TOKEN_KEY = 'mywallet-token';
const USER_KEY = 'mywallet-user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser<T>(): T | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
