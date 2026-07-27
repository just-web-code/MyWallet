import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { Wallet } from '../../core/models';
import { WalletsService } from '../../core/services/wallets.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-wallets',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header title="Wallets" subtitle="Your accounts and their balances.">
      <p-button label="New wallet" icon="pi pi-plus" routerLink="/wallets/new" />
    </app-page-header>

    <div class="rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900">
      <p-table
        #dt
        [value]="rows()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 25, 50]"
        [globalFilterFields]="['name', 'currency']"
        styleClass="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <ng-template pTemplate="caption">
          <p-iconfield class="w-full sm:w-80">
            <p-inputicon class="pi pi-search" />
            <input
              pInputText
              type="text"
              class="w-full"
              placeholder="Search wallets…"
              (input)="dt.filterGlobal($any($event.target).value, 'contains')"
            />
          </p-iconfield>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
            <th pSortableColumn="balance">Balance <p-sortIcon field="balance" /></th>
            <th pSortableColumn="currency">Currency <p-sortIcon field="currency" /></th>
            <th pSortableColumn="created_at">Created <p-sortIcon field="created_at" /></th>
            <th class="w-36 text-right">Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr>
            <td class="font-medium">{{ row.name }}</td>
            <td>{{ row.balance | number: '1.0-0' }}</td>
            <td>{{ row.currency }}</td>
            <td>{{ row.created_at | date: 'dd.MM.yyyy' }}</td>
            <td>
              <div class="flex items-center justify-end gap-1">
                <p-button
                  icon="pi pi-list"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  [routerLink]="['/transactions']"
                  [queryParams]="{ wallet: row.id }"
                  ariaLabel="Transactions"
                />
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  [routerLink]="['/wallets', row.id, 'edit']"
                  ariaLabel="Edit"
                />
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
            <td colspan="5" class="py-8 text-center text-surface-500">No wallets yet.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmdialog />
  `,
})
export class WalletsComponent {
  private readonly wallets = inject(WalletsService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  readonly rows = signal<Wallet[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.rows.set(await this.wallets.list());
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(row: Wallet): void {
    this.confirm.confirm({
      header: 'Delete wallet',
      message: `Delete ${row.name}? Its transactions are deleted too.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.wallets.remove(row.id);
          this.toast.success('Wallet deleted');
          await this.load();
        } catch (e) {
          this.toast.error((e as Error).message);
        }
      },
    });
  }
}
