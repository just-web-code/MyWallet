import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { Category, Stats, Transaction, Wallet } from '../../core/models';
import { StatsService } from '../../core/services/stats.service';
import { WalletsService } from '../../core/services/wallets.service';
import { CategoriesService } from '../../core/services/categories.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    ChartModule,
    TableModule,
    TagModule,
    ButtonModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Dashboard" subtitle="Where your money sits and where it went." />

    <!-- Stat cards straight from /stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @for (s of cards(); track s.key) {
        <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ s.label }}</span>
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300">
              <i [class]="s.icon"></i>
            </span>
          </div>
          <div class="mt-3 text-2xl font-bold text-surface-900 dark:text-surface-0">
            {{ s.value | number: '1.0-0' }}
          </div>
        </div>
      }
    </div>

    <!-- Charts -->
    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 lg:col-span-2 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="mb-4 font-semibold text-surface-900 dark:text-surface-0">Balance by wallet</h2>
        <p-chart type="bar" [data]="walletData()" [options]="barOptions" height="280px" />
      </div>
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="mb-4 font-semibold text-surface-900 dark:text-surface-0">Income vs expense</h2>
        <p-chart type="doughnut" [data]="flowData()" [options]="doughnutOptions" height="280px" />
      </div>
    </div>

    <!-- Recent activity of the newest wallet -->
    <div class="mt-4 rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold text-surface-900 dark:text-surface-0">
          Recent transactions{{ recentWallet() ? ' — ' + recentWallet()!.name : '' }}
        </h2>
        <p-button label="All transactions" [text]="true" size="small" routerLink="/transactions" />
      </div>
      <p-table [value]="recent()" [loading]="loading()" styleClass="p-datatable-sm" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Type</th>
            <th class="text-right">Amount</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-t>
          <tr>
            <td>{{ t.created_at | date: 'dd.MM.yyyy HH:mm' }}</td>
            <td class="font-medium">{{ categoryName(t.category_id) }}</td>
            <td class="text-surface-500">{{ t.description || '—' }}</td>
            <td><p-tag [value]="t.is_income ? 'Income' : 'Expense'" [severity]="t.is_income ? 'success' : 'danger'" /></td>
            <td class="text-right font-medium" [class.text-green-600]="t.is_income" [class.text-red-600]="!t.is_income">
              {{ t.is_income ? '+' : '−' }}{{ t.amount | number: '1.0-0' }}
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="py-8 text-center text-surface-500">Nothing recorded yet.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class DashboardComponent {
  private readonly statsApi = inject(StatsService);
  private readonly walletsApi = inject(WalletsService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly transactionsApi = inject(TransactionsService);
  private readonly toast = inject(ToastService);

  readonly cards = signal<StatCard[]>([]);
  readonly recent = signal<Transaction[]>([]);
  readonly recentWallet = signal<Wallet | null>(null);
  readonly loading = signal(true);
  readonly walletData = signal<unknown>(null);
  readonly flowData = signal<unknown>(null);

  readonly barOptions = this.buildBarOptions();
  readonly doughnutOptions = this.buildDoughnutOptions();

  private categoryNames = new Map<number, string>();

  constructor() {
    void this.load();
  }

  categoryName(id: number): string {
    return this.categoryNames.get(id) ?? `#${id}`;
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [stats, wallets, categories] = await Promise.all([
        this.statsApi.summary(),
        this.walletsApi.list(),
        this.categoriesApi.list(),
      ]);

      this.categoryNames = new Map(categories.map((c: Category) => [c.id, c.name]));
      this.cards.set(this.toCards(stats));
      this.walletData.set(this.toWalletChart(wallets));
      this.flowData.set(this.toFlowChart(stats));

      // The API pages transactions per wallet; show the newest wallet's ledger.
      const first = wallets[0] ?? null;
      this.recentWallet.set(first);
      this.recent.set(first ? (await this.transactionsApi.listByWallet(first.id, 5, 0)).items : []);
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  private toCards(stats: Stats): StatCard[] {
    return [
      { key: 'balance', label: 'Total balance', value: stats.total_balance, icon: 'pi pi-wallet' },
      { key: 'income', label: 'Total income', value: stats.total_income, icon: 'pi pi-arrow-down-left' },
      { key: 'expense', label: 'Total expense', value: stats.total_expense, icon: 'pi pi-arrow-up-right' },
      { key: 'net', label: 'Net', value: stats.net, icon: 'pi pi-chart-line' },
    ];
  }

  private toWalletChart(wallets: Wallet[]): unknown {
    const primary = this.cssVar('--p-primary-500', '#6366f1');
    return {
      labels: wallets.map((w) => w.name),
      datasets: [
        {
          label: 'Balance',
          data: wallets.map((w) => w.balance),
          backgroundColor: primary + 'cc',
          borderRadius: 6,
        },
      ],
    };
  }

  private toFlowChart(stats: Stats): unknown {
    return {
      labels: ['Income', 'Expense'],
      datasets: [{ data: [stats.total_income, stats.total_expense], backgroundColor: ['#22c55e', '#ef4444'] }],
    };
  }

  private cssVar(name: string, fallback: string): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  private buildBarOptions(): unknown {
    const text = this.cssVar('--p-text-muted-color', '#6b7280');
    const grid = this.cssVar('--p-content-border-color', '#e5e7eb');
    return {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: text }, grid: { display: false } },
        y: { ticks: { color: text }, grid: { color: grid } },
      },
    };
  }

  private buildDoughnutOptions(): unknown {
    const text = this.cssVar('--p-text-color', '#374151');
    return { maintainAspectRatio: false, plugins: { legend: { labels: { color: text } } } };
  }
}
