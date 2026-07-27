import { Injectable, inject } from '@angular/core';

import { Stats } from '../models';
import { ApiService } from './api.service';

/** `/stats` — wallets, total balance, lifetime income / expense / net. */
@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly api = inject(ApiService);

  summary(): Promise<Stats> {
    return this.api.get<Stats>('/stats');
  }
}
