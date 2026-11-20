// ─── Category Service (Manager API) ───────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { Category } from './types';

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

function mapCategory(c: any): Category {
  return {
    id: c.id,
    organization_id: c.organization_id || c.organization,
    name: c.name || c.name_uz || 'Kategoriya',
    name_uz: c.name_uz || c.name,
    icon: c.icon || '🍲',
    sort_order: c.sort_order ?? 0,
    is_active: c.is_active ?? true,
    items_count: c.items_count,
  };
}

class CategoryService {
  async getCategories(): Promise<ApiResponseEnvelope<Category[]>> {
    const res = await managerApi.categories.getCategories();
    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items.map(mapCategory) };
    }
    return { success: false, error: res.error };
  }

  async createCategory(data: CreateCategoryRequest): Promise<ApiResponseEnvelope<Category>> {
    const res = await managerApi.categories.createCategory({
      name: data.name,
      icon: data.icon || '🍲',
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    });

    if (res.success && res.data) {
      return { success: true, data: mapCategory(res.data) };
    }

    return { success: false, error: res.error };
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponseEnvelope<Category>> {
    const res = await managerApi.categories.updateCategory(id, data);
    if (res.success && res.data) {
      return { success: true, data: mapCategory(res.data) };
    }
    return { success: false, error: res.error };
  }

  async deleteCategory(id: string): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.categories.deleteCategory(id);
    return { success: res.success, error: res.error, data: undefined };
  }
}

export const categoryService = new CategoryService();
