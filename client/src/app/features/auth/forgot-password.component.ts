import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { TranslateModule } from '@ngx-translate/core';

/**
 * The MyWallet API has no password-reset endpoint, so this page says so
 * plainly instead of pretending to send a mail.
 */
@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, MessageModule, TranslateModule],
  template: `
    <div
      class="flex min-h-screen items-center justify-center bg-surface-50 p-4 text-surface-900 dark:bg-surface-950 dark:text-surface-0"
    >
      <div class="w-full max-w-sm rounded-2xl border border-surface-200 bg-surface-0 p-8 shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <h1 class="mb-1 text-2xl font-bold">{{ 'forgot_password.title' | translate }}</h1>
        <p class="mb-6 text-sm text-surface-500 dark:text-surface-400">
          {{ 'forgot_password.subtitle' | translate }}
        </p>

        <p-message severity="info" [text]="'forgot_password.unavailable' | translate" styleClass="w-full" />

        <a routerLink="/login" class="mt-6 block text-center text-sm text-primary-600 hover:underline">
          {{ 'forgot_password.back_to_login' | translate }}
        </a>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {}
