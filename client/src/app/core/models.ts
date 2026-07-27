/**
 * Wire models for the MyWallet API. Field names are snake_case because that is
 * exactly what the JWC entities serialise (see Data/AppDbContext.jwc).
 * Money is a whole integer amount (so'm), never a decimal.
 */

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  name: string;
  balance: number;
  currency: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  usage_count: number;
  user_id: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  category_id: number;
  amount: number;
  is_income: boolean;
  description: string;
  created_at: string;
  user_id: number;
}

/** Envelope returned by the paged list endpoints (transactions). */
export interface Paged<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface Stats {
  wallets: number;
  total_balance: number;
  total_income: number;
  total_expense: number;
  net: number;
}

export interface CreateWalletRequest {
  name: string;
  currency: string;
  balance?: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateTransactionRequest {
  category_id: number;
  amount: number;
  is_income?: boolean;
  description?: string;
}
