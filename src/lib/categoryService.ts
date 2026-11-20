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
  private cache: { data: Category[]; timestamp: number } | null = null;
  private inFlight: Promise<ApiResponseEnvelope<Category[]>> | null = null;

  invalidateCache() {
    this.cache = null;
  }

  async getCategories(force = false): Promise<ApiResponseEnvelope<Category[]>> {
    const TTL = 2 * 60 * 1000; // 2 minutes

    if (!force && this.cache && Date.now() - this.cache.timestamp < TTL) {
      return { success: true, data: this.cache.data };
    }

    if (this.inFlight && !force) {
      return this.inFlight;
    }

    const run = (async () => {
      try {
        const res = await managerApi.categories.getCategories();
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : [];
          const mapped = items.map(mapCategory);
          this.cache = { data: mapped, timestamp: Date.now() };
          return { success: true, data: mapped };
        }
        return { success: false, error: res.error };
      } finally {
        this.inFlight = null;
      }
    })();

    this.inFlight = run;
    return run;
  }

  async createCategory(data: CreateCategoryRequest): Promise<ApiResponseEnvelope<Category>> {
    this.invalidateCache();
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
    this.invalidateCache();
    const res = await managerApi.categories.updateCategory(id, data);
    if (res.success && res.data) {
      return { success: true, data: mapCategory(res.data) };
    }
    return { success: false, error: res.error };
  }

  async deleteCategory(id: string): Promise<ApiResponseEnvelope<void>> {
    this.invalidateCache();
    const res = await managerApi.categories.deleteCategory(id);
    return { success: res.success, error: res.error, data: undefined };
  }
}

export const categoryService = new CategoryService();
