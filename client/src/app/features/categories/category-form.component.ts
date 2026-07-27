import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { CategoriesService } from '../../core/services/categories.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, PageHeaderComponent],
  template: `
    <app-page-header
      [title]="isEdit() ? 'Edit category' : 'New category'"
      subtitle="Names are unique within your account."
    />

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="max-w-2xl rounded-xl border border-surface-200 bg-surface-0 p-6 dark:border-surface-800 dark:bg-surface-900"
    >
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <label for="name" class="text-sm font-medium">Name</label>
          <input id="name" pInputText formControlName="name" class="w-full" [class.ng-invalid]="err('name')" [class.ng-dirty]="err('name')" />
          @if (err('name')) {
            <small class="text-red-500">Name is required.</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="description" class="text-sm font-medium">Description</label>
          <textarea id="description" pTextarea formControlName="description" rows="3" class="w-full"></textarea>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2 border-t border-surface-200 pt-4 dark:border-surface-800">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="cancel()" />
        <p-button type="submit" label="Save" icon="pi pi-check" [loading]="saving()" />
      </div>
    </form>
  `,
})
export class CategoryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categories = inject(CategoriesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  readonly isEdit = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
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
      const category = await this.categories.get(this.editId);
      this.form.patchValue({ name: category.name, description: category.description });
    } catch (e) {
      this.toast.error((e as Error).message);
      this.router.navigate(['/categories']);
    }
  }

  err(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  cancel(): void {
    this.router.navigate(['/categories']);
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
        await this.categories.update(this.editId, data);
        this.toast.success('Category updated');
      } else {
        await this.categories.create(data);
        this.toast.success('Category created');
      }
      this.router.navigate(['/categories']);
    } catch (e) {
      this.toast.error((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
