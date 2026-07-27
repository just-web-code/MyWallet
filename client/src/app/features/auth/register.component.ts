import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, TranslateModule],
  template: `
    <div
      class="flex min-h-screen items-center justify-center bg-surface-50 p-4 text-surface-900 dark:bg-surface-950 dark:text-surface-0"
    >
      <div class="w-full max-w-sm rounded-2xl border border-surface-200 bg-surface-0 p-8 shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <h1 class="mb-1 text-2xl font-bold">MyWallet</h1>
        <p class="mb-6 text-sm text-surface-500 dark:text-surface-400">
          {{ 'register.subtitle' | translate }}
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label for="first_name" class="text-sm font-medium">{{ 'register.first_name' | translate }}</label>
              <input id="first_name" pInputText formControlName="first_name" class="w-full" [class.ng-invalid]="invalid('first_name')" [class.ng-dirty]="invalid('first_name')" />
            </div>
            <div class="flex flex-col gap-1">
              <label for="last_name" class="text-sm font-medium">{{ 'register.last_name' | translate }}</label>
              <input id="last_name" pInputText formControlName="last_name" class="w-full" [class.ng-invalid]="invalid('last_name')" [class.ng-dirty]="invalid('last_name')" />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label for="email" class="text-sm font-medium">{{ 'login.email' | translate }}</label>
            <input
              id="email"
              pInputText
              type="email"
              formControlName="email"
              class="w-full"
              [class.ng-invalid]="invalid('email')"
              [class.ng-dirty]="invalid('email')"
            />
            @if (invalid('email')) {
              <small class="text-red-500">{{ 'login.email_invalid' | translate }}</small>
            }
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="text-sm font-medium">{{ 'login.password' | translate }}</label>
            <p-password
              inputId="password"
              formControlName="password"
              [toggleMask]="true"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            <!-- The API rejects anything shorter than 8 characters. -->
            @if (invalid('password')) {
              <small class="text-red-500">{{ 'register.password_min' | translate }}</small>
            }
          </div>

          <p-button
            type="submit"
            [label]="'register.submit' | translate"
            styleClass="w-full"
            [loading]="loading()"
          />
        </form>

        <p class="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
          {{ 'register.have_account' | translate }}
          <a routerLink="/login" class="text-primary-600 hover:underline">
            {{ 'login.submit' | translate }}
          </a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.maxLength(120)]],
    last_name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.register(this.form.getRawValue());
      this.router.navigateByUrl('/');
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
