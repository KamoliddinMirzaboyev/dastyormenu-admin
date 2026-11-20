// ─── Menu Service (Manager API) ───────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { Menu, MenuItemType, PreparationArea } from './types';

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
  return {
    id: m.id,
    organization_id: m.organization_id || m.organization || '',
    category_id: m.category_id || m.category || '',
    name: m.name || m.name_uz || 'Taom',
    description: m.description || m.description_uz || null,
    ingredients: m.ingredients || m.ingredients_uz || null,
    image_url: m.image_url || m.image || null,
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
  async getMenus(categoryId?: string): Promise<ApiResponseEnvelope<Menu[]>> {
    const params: Record<string, string> = {};
    if (categoryId && categoryId !== 'all') {
      params.category = categoryId;
    }

    const res = await managerApi.menu.getMenu(params);

    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items.map(mapMenu) };
    }

    return { success: false, error: res.error };
  }

  async createMenu(data: CreateMenuRequest): Promise<ApiResponseEnvelope<Menu>> {
    const imagePayload = typeof data.image === 'string' ? data.image : data.image_url || undefined;

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
      return { success: true, data: mapMenu(res.data) };
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
    if (typeof data.image === 'string') payload.image = data.image;
    else if (data.image_url !== undefined) payload.image = data.image_url;

    const res = await managerApi.menu.updateMenu(id, payload);
    if (res.success && res.data) {
      return { success: true, data: mapMenu(res.data) };
    }

    return { success: false, error: res.error };
  }

  async deleteMenu(id: string): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.menu.deleteMenu(id);
    return { success: res.success, error: res.error, data: undefined };
  }

  async toggleAvailable(id: string, isAvailable: boolean): Promise<ApiResponseEnvelope<Menu>> {
    const res = await managerApi.menu.toggleAvailability(id, !isAvailable);
    if (res.success && res.data) {
      return { success: true, data: mapMenu(res.data) };
    }

    return { success: false, error: res.error };
  }
}

export const menuService = new MenuService();
