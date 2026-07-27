import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import { WalletsService } from '../../core/services/wallets.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];

@Component({
  selector: 'app-wallet-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      [title]="isEdit() ? 'Edit wallet' : 'New wallet'"
      subtitle="Wallet name, currency and starting balance."
    />

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="max-w-2xl rounded-xl border border-surface-200 bg-surface-0 p-6 dark:border-surface-800 dark:bg-surface-900"
    >
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label for="name" class="text-sm font-medium">Name</label>
          <input id="name" pInputText formControlName="name" class="w-full" [class.ng-invalid]="err('name')" [class.ng-dirty]="err('name')" />
          @if (err('name')) {
            <small class="text-red-500">Name is required.</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="currency" class="text-sm font-medium">Currency</label>
          <p-select inputId="currency" formControlName="currency" [options]="currencies" [editable]="true" styleClass="w-full" />
          @if (err('currency')) {
            <small class="text-red-500">Currency is required.</small>
          }
        </div>

        <!-- Balance is only settable at creation: afterwards it moves solely
             through transactions, so PATCH /wallets/{id} ignores it. -->
        @if (!isEdit()) {
          <div class="flex flex-col gap-1">
            <label for="balance" class="text-sm font-medium">Starting balance</label>
            <p-inputnumber inputId="balance" formControlName="balance" [min]="0" styleClass="w-full" inputStyleClass="w-full" />
            <small class="text-surface-500">Whole amounts only — the API stores money as an integer.</small>
          </div>
        } @else {
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium">Balance</span>
            <span class="text-sm text-surface-500">Changes only through transactions.</span>
          </div>
        }
      </div>

      <div class="mt-6 flex justify-end gap-2 border-t border-surface-200 pt-4 dark:border-surface-800">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="cancel()" />
        <p-button type="submit" label="Save" icon="pi pi-check" [loading]="saving()" />
      </div>
    </form>
  `,
})
export class WalletFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly wallets = inject(WalletsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Route param `:id` (bound via withComponentInputBinding); absent on /new. */
  readonly id = input<string>();
  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly currencies = CURRENCIES;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    currency: ['UZS', Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
  });

  private editId: number | null = null;

  async ngOnInit(): Promise<void> {
    const idStr = this.id();
    if (!idStr) {
      return;
    }
    this.isEdit.set(true);
    this.editId = Number(idStr);
    try {
      const wallet = await this.wallets.get(this.editId);
      this.form.patchValue({
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
      });
    } catch (e) {
      this.toast.error((e as Error).message);
      this.router.navigate(['/wallets']);
    }
  }

  err(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  cancel(): void {
    this.router.navigate(['/wallets']);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const data = this.form.getRawValue();
      if (this.editId !== null) {
        await this.wallets.update(this.editId, { name: data.name, currency: data.currency });
        this.toast.success('Wallet updated');
      } else {
        await this.wallets.create(data);
        this.toast.success('Wallet created');
      }
      this.router.navigate(['/wallets']);
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
