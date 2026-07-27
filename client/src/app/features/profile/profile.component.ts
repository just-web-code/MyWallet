import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

import { Stats } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { StatsService } from '../../core/services/stats.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

/**
 * Read-only account card: the API has no profile-update endpoint, so nothing
 * here pretends to be editable. Numbers come from /stats.
 */
@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, AvatarModule, ButtonModule, PageHeaderComponent],
  template: `
    <app-page-header title="Profile" subtitle="Your account at a glance." />

    <div class="max-w-2xl rounded-xl border border-surface-200 bg-surface-0 p-6 dark:border-surface-800 dark:bg-surface-900">
      <div class="flex items-center gap-4">
        <p-avatar [label]="auth.initials()" size="xlarge" shape="circle" styleClass="!h-20 !w-20 !text-2xl" />
        <div class="min-w-0">
          <div class="truncate text-lg font-semibold text-surface-900 dark:text-surface-0">
            {{ auth.user()?.name || 'Guest' }}
          </div>
          <div class="truncate text-sm text-surface-500 dark:text-surface-400">{{ auth.user()?.email }}</div>
        </div>
      </div>

      @if (stats(); as s) {
        <dl class="mt-6 grid grid-cols-2 gap-4 border-t border-surface-200 pt-6 sm:grid-cols-4 dark:border-surface-800">
          <div>
            <dt class="text-xs text-surface-500 dark:text-surface-400">Wallets</dt>
            <dd class="mt-1 text-lg font-semibold">{{ s.wallets }}</dd>
          </div>
          <div>
            <dt class="text-xs text-surface-500 dark:text-surface-400">Balance</dt>
            <dd class="mt-1 text-lg font-semibold">{{ s.total_balance | number: '1.0-0' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-surface-500 dark:text-surface-400">Income</dt>
            <dd class="mt-1 text-lg font-semibold text-green-600">{{ s.total_income | number: '1.0-0' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-surface-500 dark:text-surface-400">Expense</dt>
            <dd class="mt-1 text-lg font-semibold text-red-600">{{ s.total_expense | number: '1.0-0' }}</dd>
          </div>
        </dl>
      }

      <div class="mt-6 border-t border-surface-200 pt-4 dark:border-surface-800">
        <p-button label="Sign out" icon="pi pi-sign-out" severity="secondary" [outlined]="true" (onClick)="logout()" />
      </div>
    </div>
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly statsApi = inject(StatsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly stats = signal<Stats | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.stats.set(await this.statsApi.summary());
    } catch (e) {
      this.toast.error((e as Error).message);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
