import { Injectable, inject } from '@angular/core';

import { Category, CreateCategoryRequest } from '../models';
import { ApiService } from './api.service';

/** `/categories` CRUD. Names are unique per user; delete is refused (400)
 *  while transactions still reference the category. */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(ApiService);

  list(): Promise<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  get(id: number): Promise<Category> {
    return this.api.get<Category>(`/categories/${id}`);
  }

  create(req: CreateCategoryRequest): Promise<Category> {
    return this.api.post<Category>('/categories', req);
  }

  update(id: number, req: Partial<CreateCategoryRequest>): Promise<Category> {
    return this.api.patch<Category>(`/categories/${id}`, req);
  }

  remove(id: number): Promise<void> {
    return this.api.delete(`/categories/${id}`);
  }
}
