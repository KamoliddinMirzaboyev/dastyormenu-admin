// ─── Category Service (Demo / Mock Mode) ──────────────────────────────────────

import { ApiResponse } from './api';
import { Category } from './types';
import { mockStore } from './mockStore';

export interface CreateCategoryRequest {
  organization?: string;
  name: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

class CategoryService {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const data = mockStore.getCategories();
    return { success: true, data };
  }

  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    const created = mockStore.createCategory({
      name: data.name,
      icon: data.icon,
      sort_order: data.sort_order,
    });
    return { success: true, data: created };
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    const updated = mockStore.updateCategory(id, data);
    if (!updated) {
      return { success: false, error: { message: 'Kategoriya topilmadi' } };
    }
    return { success: true, data: updated };
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    mockStore.deleteCategory(id);
    return { success: true, data: undefined };
  }
}

export const categoryService = new CategoryService();
