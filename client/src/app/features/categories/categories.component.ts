import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { Category } from '../../core/models';
import { CategoriesService } from '../../core/services/categories.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-categories',
  imports: [
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header title="Categories" subtitle="How your spending is grouped. Most used first.">
      <p-button label="New category" icon="pi pi-plus" routerLink="/categories/new" />
    </app-page-header>

    <div class="rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900">
      <p-table
        #dt
        [value]="rows()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 25, 50]"
        [globalFilterFields]="['name', 'description']"
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
              placeholder="Search categories…"
              (input)="dt.filterGlobal($any($event.target).value, 'contains')"
            />
          </p-iconfield>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
            <th pSortableColumn="description">Description <p-sortIcon field="description" /></th>
            <th pSortableColumn="usage_count">Used <p-sortIcon field="usage_count" /></th>
            <th class="w-28 text-right">Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr>
            <td class="font-medium">{{ row.name }}</td>
            <td class="text-surface-500">{{ row.description || '—' }}</td>
            <td><p-tag [value]="row.usage_count" severity="secondary" /></td>
            <td>
              <div class="flex items-center justify-end gap-1">
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  [routerLink]="['/categories', row.id, 'edit']"
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
            <td colspan="4" class="py-8 text-center text-surface-500">No categories yet.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmdialog />
  `,
})
export class CategoriesComponent {
  private readonly categories = inject(CategoriesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  readonly rows = signal<Category[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.rows.set(await this.categories.list());
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(row: Category): void {
    this.confirm.confirm({
      header: 'Delete category',
      // The API refuses (400) while transactions still reference it.
      message: `Delete ${row.name}? Only possible when no transaction uses it.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.categories.remove(row.id);
          this.toast.success('Category deleted');
          await this.load();
        } catch (e) {
          this.toast.error((e as Error).message);
        }
      },
    });
  }
}
