import { Injectable, inject } from '@angular/core';

import { CreateTransactionRequest, Paged, Transaction } from '../models';
import { ApiService } from './api.service';

/** Transactions live under a wallet; deleting one reverses its balance effect. */
@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly api = inject(ApiService);

  /** Newest first; the API answers with an `{ items, limit, offset, total }` envelope. */
  listByWallet(walletId: number, limit = 20, offset = 0): Promise<Paged<Transaction>> {
    return this.api.get<Paged<Transaction>>(`/wallets/${walletId}/transactions`, { limit, offset });
  }

  create(walletId: number, req: CreateTransactionRequest): Promise<Transaction> {
    return this.api.post<Transaction>(`/wallets/${walletId}/transactions`, req);
  }

  get(id: number): Promise<Transaction> {
    return this.api.get<Transaction>(`/transactions/${id}`);
  }

  remove(id: number): Promise<void> {
    return this.api.delete(`/transactions/${id}`);
  }
}
