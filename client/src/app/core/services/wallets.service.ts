import { Injectable, inject } from '@angular/core';

import { CreateWalletRequest, Wallet } from '../models';
import { ApiService } from './api.service';

/** `/wallets` CRUD. Deleting a wallet also deletes its transactions. */
@Injectable({ providedIn: 'root' })
export class WalletsService {
  private readonly api = inject(ApiService);

  list(): Promise<Wallet[]> {
    return this.api.get<Wallet[]>('/wallets');
  }

  get(id: number): Promise<Wallet> {
    return this.api.get<Wallet>(`/wallets/${id}`);
  }

  create(req: CreateWalletRequest): Promise<Wallet> {
    return this.api.post<Wallet>('/wallets', req);
  }

  update(id: number, req: Partial<CreateWalletRequest>): Promise<Wallet> {
    return this.api.patch<Wallet>(`/wallets/${id}`, req);
  }

  remove(id: number): Promise<void> {
    return this.api.delete(`/wallets/${id}`);
  }
}
