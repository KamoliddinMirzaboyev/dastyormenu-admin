// ─── Menu Service (Manager API) ───────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { Menu, MenuItemType, PreparationArea } from './types';
import { queryClient } from './queryClient';

export interface CreateMenuRequest {
  organization?: string;
  name: string;
  item_type?: MenuItemType;
  unit?: string;
  unit_amount?: number | string;
  description?: string;
  image?: File | string;
  image_url?: string;
  price: number; // in tiyin
  cost_price?: number; // in tiyin
  category: string;
  cook_time_minutes: number;
  preparation_area?: PreparationArea;
  ingredients?: string;
  is_available?: boolean;
  sort_order?: number;
}

export interface UpdateMenuRequest {
  category?: string;
  item_type?: MenuItemType;
  unit?: string;
  unit_amount?: number | string;
  name?: string;
  description?: string;
  image?: File | string;
  image_url?: string;
  price?: number; // in tiyin
  cost_price?: number; // in tiyin
  cook_time_minutes?: number;
  preparation_area?: PreparationArea;
  ingredients?: string;
  is_available?: boolean;
  sort_order?: number;
}

function mapMenu(m: any): Menu {
  let resolvedImage: string | null = null;
  if (typeof m.image_url === 'string' && m.image_url.trim()) {
    resolvedImage = m.image_url.trim();
  } else if (typeof m.image === 'string' && m.image.trim()) {
    resolvedImage = m.image.trim();
  } else if (m.image && typeof m.image === 'object' && typeof m.image.url === 'string') {
    resolvedImage = m.image.url.trim();
  } else if (typeof m.photo_url === 'string' && m.photo_url.trim()) {
    resolvedImage = m.photo_url.trim();
  } else if (typeof m.photo === 'string' && m.photo.trim()) {
    resolvedImage = m.photo.trim();
  }

  return {
    id: m.id,
    organization_id: m.organization_id || m.organization || '',
    category_id: m.category_id || m.category || '',
    name: m.name || m.name_uz || 'Taom',
    description: m.description || m.description_uz || null,
    ingredients: m.ingredients || m.ingredients_uz || null,
    image_url: resolvedImage,
    price: m.price || 0, // already in tiyin
    cost_price: m.cost_price || 0,
    cook_time_minutes: m.cook_time_minutes ?? 15,
    preparation_area: m.preparation_area || (m.item_type === 'product' ? 'none' : 'kitchen'),
    is_available: m.is_available ?? true,
    sort_order: m.sort_order ?? 0,
    item_type: m.item_type || (m.preparation_area === 'none' || m.preparation_area === 'bar' ? 'product' : 'dish'),
    unit: m.unit,
    unit_amount: m.unit_amount,
  };
}

class MenuService {
  private cache: { data: Menu[]; timestamp: number } | null = null;
  private inFlight: Promise<ApiResponseEnvelope<Menu[]>> | null = null;

  invalidateCache() {
    this.cache = null;
  }

  async getMenus(categoryId?: string, force = false): Promise<ApiResponseEnvelope<Menu[]>> {
    const isAll = !categoryId || categoryId === 'all';
    const TTL = 60 * 1000; // 60s in-memory cache

    if (isAll && !force && this.cache && Date.now() - this.cache.timestamp < TTL) {
      return { success: true, data: this.cache.data };
    }

    if (isAll && this.inFlight && !force) {
      return this.inFlight;
    }

    const params: Record<string, string> = {};
    if (categoryId && categoryId !== 'all') {
      params.category = categoryId;
    }

    const run = (async () => {
      try {
        const res = await managerApi.menu.getMenu(params);

        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : [];
          const mapped = items.map(mapMenu);
          if (isAll) {
            this.cache = { data: mapped, timestamp: Date.now() };
          }
          return { success: true, data: mapped };
        }

        return { success: false, error: res.error };
      } finally {
        if (isAll) {
          this.inFlight = null;
        }
      }
    })();

    if (isAll) {
      this.inFlight = run;
    }

    return run;
  }

  async createMenu(data: CreateMenuRequest): Promise<ApiResponseEnvelope<Menu>> {
    this.invalidateCache();
    const imagePayload = typeof data.image === 'string' && data.image.trim()
      ? data.image.trim()
      : (typeof data.image_url === 'string' && data.image_url.trim() ? data.image_url.trim() : undefined);

    const payload = {
      name: data.name,
      category: data.category,
      item_type: data.item_type || 'dish',
      price: data.price, // in tiyin
      cost_price: data.cost_price || 0,
      description: data.description || '',
      ingredients: data.ingredients || '',
      cook_time_minutes: data.cook_time_minutes ?? 15,
      image: imagePayload,
      is_available: data.is_available ?? true,
      sort_order: data.sort_order ?? 0,
      unit: data.unit,
      unit_amount: data.unit_amount,
      preparation_area: data.preparation_area || (data.item_type === 'product' ? 'none' : 'kitchen'),
    };

    const res = await managerApi.menu.createMenu(payload);
    if (res.success && res.data) {
      this.invalidateCache();
      const created = mapMenu(res.data);
      queryClient.setQueryData<Menu[]>('menu', (prev) =>
        prev ? [...prev, created] : [created]
      );
      return { success: true, data: created };
    }

    return { success: false, error: res.error };
  }

  async updateMenu(id: string, data: UpdateMenuRequest): Promise<ApiResponseEnvelope<Menu>> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.category !== undefined) payload.category = data.category;
    if (data.item_type !== undefined) payload.item_type = data.item_type;
    if (data.price !== undefined) payload.price = data.price;
    if (data.cost_price !== undefined) payload.cost_price = data.cost_price;
    if (data.description !== undefined) payload.description = data.description;
    if (data.ingredients !== undefined) payload.ingredients = data.ingredients;
    if (data.cook_time_minutes !== undefined) payload.cook_time_minutes = data.cook_time_minutes;
    if (data.is_available !== undefined) payload.is_available = data.is_available;
    if (data.sort_order !== undefined) payload.sort_order = data.sort_order;
    if (data.unit !== undefined) payload.unit = data.unit;
    if (data.unit_amount !== undefined) payload.unit_amount = data.unit_amount;
    if (typeof data.image === 'string' && data.image.trim()) {
      payload.image = data.image.trim();
    } else if (typeof data.image_url === 'string' && data.image_url.trim()) {
      payload.image = data.image_url.trim();
    }

    const res = await managerApi.menu.updateMenu(id, payload);
    if (res.success) {
      this.invalidateCache();
      const updated = res.data ? mapMenu(res.data) : undefined;
      if (updated) {
        queryClient.setQueryData<Menu[]>('menu', (prev) =>
          (prev ?? []).map((m) => (m.id === id ? updated : m))
        );
      }
      return { success: true, data: updated };
    }

    return { success: false, error: res.error };
  }

  async deleteMenu(id: string): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.menu.deleteMenu(id);
    if (res.success) {
      this.invalidateCache();
      queryClient.setQueryData<Menu[]>('menu', (prev) =>
        (prev ?? []).filter((m) => m.id !== id)
      );
    }
    return { success: res.success, error: res.error, data: undefined };
  }

  async toggleAvailable(id: string, isAvailable: boolean): Promise<ApiResponseEnvelope<Menu>> {
    const res = await managerApi.menu.toggleAvailability(id, !isAvailable);
    if (res.success && res.data) {
      this.invalidateCache();
      const updated = mapMenu(res.data);
      queryClient.setQueryData<Menu[]>('menu', (prev) =>
        (prev ?? []).map((m) => (m.id === id ? updated : m))
      );
      return { success: true, data: updated };
    }

    return { success: false, error: res.error };
  }

  async toggleAvailability(id: string, isAvailable: boolean): Promise<ApiResponseEnvelope<Menu>> {
    return this.toggleAvailable(id, isAvailable);
  }
}

export const menuService = new MenuService();
