import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { Category, Transaction, Wallet } from '../../core/models';
import { WalletsService } from '../../core/services/wallets.service';
import { CategoriesService } from '../../core/services/categories.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

/** How many rows one API page pulls (the API pages with limit/offset). */
const PAGE_SIZE = 50;

@Component({
  selector: 'app-transactions',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
    PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header title="Transactions" subtitle="Income and expenses of a wallet.">
      <p-select
        [options]="wallets()"
        optionLabel="name"
        optionValue="id"
        [ngModel]="walletId()"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="selectWallet($event)"
        placeholder="Select wallet"
        styleClass="w-52"
      />
      <p-button
        label="New transaction"
        icon="pi pi-plus"
        [disabled]="walletId() === null"
        (onClick)="openCreate()"
      />
    </app-page-header>

    @if (wallets().length === 0 && !loading()) {
      <div class="rounded-xl border border-surface-200 bg-surface-0 p-8 text-center dark:border-surface-800 dark:bg-surface-900">
        <p class="text-surface-500">Create a wallet first — transactions belong to one.</p>
        <p-button label="New wallet" icon="pi pi-plus" routerLink="/wallets/new" styleClass="mt-4" />
      </div>
    } @else {
      <div class="rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900">
        <p-table
          [value]="rows()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          styleClass="p-datatable-sm"
          responsiveLayout="scroll"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="created_at">Date <p-sortIcon field="created_at" /></th>
              <th>Category</th>
              <th>Description</th>
              <th pSortableColumn="is_income">Type <p-sortIcon field="is_income" /></th>
              <th pSortableColumn="amount" class="text-right">Amount <p-sortIcon field="amount" /></th>
              <th class="w-16 text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.created_at | date: 'dd.MM.yyyy HH:mm' }}</td>
              <td class="font-medium">{{ categoryName(row.category_id) }}</td>
              <td class="text-surface-500">{{ row.description || '—' }}</td>
              <td>
                <p-tag
                  [value]="row.is_income ? 'Income' : 'Expense'"
                  [severity]="row.is_income ? 'success' : 'danger'"
                />
              </td>
              <td
                class="text-right font-medium"
                [class.text-green-600]="row.is_income"
                [class.text-red-600]="!row.is_income"
              >
                {{ row.is_income ? '+' : '−' }}{{ row.amount | number: '1.0-0' }}
              </td>
              <td>
                <div class="flex items-center justify-end">
                  <p-button
                    icon="pi pi-trash"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="danger"
                    (onClick)="confirmDelete(row)"
                    ariaLabel="Delete"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="py-8 text-center text-surface-500">No transactions yet.</td>
            </tr>
          </ng-template>
        </p-table>

        @if (hasMore()) {
          <div class="flex justify-center border-t border-surface-200 p-3 dark:border-surface-800">
            <p-button label="Load more" [text]="true" [loading]="loading()" (onClick)="loadMore()" />
          </div>
        }
      </div>
    }

    <p-dialog
      [visible]="dialogOpen()"
      (visibleChange)="dialogOpen.set($event)"
      [modal]="true"
      header="New transaction"
      styleClass="w-[min(30rem,92vw)]"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5 pt-2">
        <div class="flex flex-col gap-1">
          <label for="type" class="text-sm font-medium">Type</label>
          <p-selectbutton
            inputId="type"
            formControlName="is_income"
            [options]="types"
            optionLabel="label"
            optionValue="value"
            [allowEmpty]="false"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="category" class="text-sm font-medium">Category</label>
          <p-select
            inputId="category"
            formControlName="category_id"
            [options]="categories()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select category"
            styleClass="w-full"
          />
          @if (err('category_id')) {
            <small class="text-red-500">Category is required.</small>
          }
          @if (categories().length === 0) {
            <small class="text-surface-500">No categories yet — create one first.</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="amount" class="text-sm font-medium">Amount</label>
          <p-inputnumber inputId="amount" formControlName="amount" [min]="1" styleClass="w-full" inputStyleClass="w-full" />
          @if (err('amount')) {
            <small class="text-red-500">Amount must be a positive whole number.</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="description" class="text-sm font-medium">Description</label>
          <input id="description" pInputText formControlName="description" class="w-full" />
        </div>

        <div class="flex justify-end gap-2 border-t border-surface-200 pt-4 dark:border-surface-800">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="dialogOpen.set(false)" />
          <p-button type="submit" label="Save" icon="pi pi-check" [loading]="saving()" />
        </div>
      </form>
    </p-dialog>

    <p-confirmdialog />
  `,
})
export class TransactionsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly walletsApi = inject(WalletsService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly transactions = inject(TransactionsService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly wallets = signal<Wallet[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly rows = signal<Transaction[]>([]);
  readonly walletId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dialogOpen = signal(false);
  readonly hasMore = signal(false);

  readonly types = [
    { label: 'Expense', value: false },
    { label: 'Income', value: true },
  ];

  private readonly categoryNames = computed(
    () => new Map(this.categories().map((c) => [c.id, c.name])),
  );

  readonly form = this.fb.nonNullable.group({
    is_income: [false],
    category_id: [null as number | null, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [wallets, categories] = await Promise.all([
        this.walletsApi.list(),
        this.categoriesApi.list(),
      ]);
      this.wallets.set(wallets);
      this.categories.set(categories);

      const requested = Number(this.route.snapshot.queryParamMap.get('wallet'));
      const initial = wallets.find((w) => w.id === requested) ?? wallets[0];
      if (initial) {
        this.walletId.set(initial.id);
        await this.load();
      }
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  categoryName(id: number): string {
    return this.categoryNames().get(id) ?? `#${id}`;
  }

  err(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async selectWallet(id: number): Promise<void> {
    this.walletId.set(id);
    // Keep the URL shareable / refresh-safe.
    this.router.navigate([], { relativeTo: this.route, queryParams: { wallet: id } });
    await this.load();
  }

  /** Reloads the first API page for the selected wallet. */
  async load(): Promise<void> {
    const id = this.walletId();
    if (id === null) {
      return;
    }
    this.loading.set(true);
    try {
      const page = await this.transactions.listByWallet(id, PAGE_SIZE, 0);
      this.rows.set(page.items);
      this.hasMore.set(page.items.length < page.total);
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    const id = this.walletId();
    if (id === null) {
      return;
    }
    this.loading.set(true);
    try {
      const page = await this.transactions.listByWallet(id, PAGE_SIZE, this.rows().length);
      this.rows.update((rows) => [...rows, ...page.items]);
      this.hasMore.set(this.rows().length < page.total);
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.form.reset({ is_income: false, category_id: null, amount: 0, description: '' });
    this.dialogOpen.set(true);
  }

  async submit(): Promise<void> {
    const id = this.walletId();
    if (this.form.invalid || id === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const data = this.form.getRawValue();
      await this.transactions.create(id, {
        category_id: data.category_id as number,
        amount: data.amount,
        is_income: data.is_income,
        description: data.description,
      });
      this.toast.success('Transaction saved');
      this.dialogOpen.set(false);
      await Promise.all([this.load(), this.refreshWallets()]);
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(row: Transaction): void {
    this.confirm.confirm({
      header: 'Delete transaction',
      message: 'Delete it? The wallet balance is moved back accordingly.',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.transactions.remove(row.id);
          this.toast.success('Transaction deleted');
          await Promise.all([this.load(), this.refreshWallets()]);
        } catch (e) {
          this.toast.error((e as Error).message);
        }
      },
    });
  }

  /** Balances changed server-side; keep the wallet dropdown labels honest. */
  private async refreshWallets(): Promise<void> {
    try {
      this.wallets.set(await this.walletsApi.list());
    } catch {
      // Non-fatal: the table above is already up to date.
    }
  }
}
