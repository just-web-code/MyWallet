import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ButtonModule],
  template: `
    <div
      class="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 p-4 text-center text-surface-900 dark:bg-surface-950 dark:text-surface-0"
    >
      <p class="text-6xl font-extrabold text-primary-500">404</p>
      <h1 class="text-2xl font-semibold">Page not found</h1>
      <p class="max-w-sm text-surface-500 dark:text-surface-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <p-button routerLink="/" label="Back to dashboard" icon="pi pi-home" />
    </div>
  `,
})
export class NotFoundComponent {}
