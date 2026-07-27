import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

/**
 * Only preferences the app can actually honour live here — theme and language,
 * both persisted client-side. The MyWallet API exposes no account settings.
 */
@Component({
  selector: 'app-settings',
  imports: [FormsModule, SelectModule, ToggleSwitchModule, PageHeaderComponent],
  template: `
    <app-page-header title="Settings" subtitle="Appearance and language. Saved in this browser." />

    <div class="max-w-xl rounded-xl border border-surface-200 bg-surface-0 p-6 dark:border-surface-800 dark:bg-surface-900">
      <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-medium">Dark mode</div>
            <div class="text-xs text-surface-500 dark:text-surface-400">Switch between light and dark themes.</div>
          </div>
          <p-toggleswitch
            [ngModel]="theme.theme() === 'dark'"
            (onChange)="theme.set($event.checked ? 'dark' : 'light')"
            [ngModelOptions]="{ standalone: true }"
            ariaLabel="Toggle dark mode"
          />
        </div>

        <div class="flex flex-col gap-1 border-t border-surface-200 pt-6 dark:border-surface-800">
          <label class="text-sm font-medium">Language</label>
          <p-select
            [options]="language.languages"
            optionLabel="label"
            optionValue="code"
            [ngModel]="language.current()"
            (onChange)="language.use($event.value)"
            [ngModelOptions]="{ standalone: true }"
            styleClass="w-full sm:w-64"
          />
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);
}
