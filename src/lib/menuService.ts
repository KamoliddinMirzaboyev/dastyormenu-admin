// ─── Menu Service (Demo / Mock Mode) ──────────────────────────────────────────

import { ApiResponse } from './api';
import { Menu, MenuItemType } from './types';
import { mockStore } from './mockStore';

export interface CreateMenuRequest {
  name: string;
  item_type?: MenuItemType;
  unit?: string;
  unit_amount?: number | string;
  description?: string;
  image?: File | string;
  price: number; // tiyin
  cost_price?: number; // tiyin
  category: string;
  cook_time_minutes: number;
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
  price?: number; // tiyin
  cost_price?: number; // tiyin
  cook_time_minutes?: number;
  ingredients?: string;
  is_available?: boolean;
  sort_order?: number;
}

class MenuService {
  async getMenus(categoryId?: string): Promise<ApiResponse<Menu[]>> {
    const data = mockStore.getMenu(categoryId);
    return { success: true, data };
  }

  async createMenu(data: CreateMenuRequest): Promise<ApiResponse<Menu>> {
    let imageUrl = typeof data.image === 'string' ? data.image : null;
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
    }

    const created = mockStore.createMenu({
      name: data.name,
      item_type: data.item_type,
      unit: data.unit,
      unit_amount: data.unit_amount,
      description: data.description,
      image_url: imageUrl,
      price: data.price,
      cost_price: data.cost_price,
      category_id: data.category,
      cook_time_minutes: data.cook_time_minutes,
      ingredients: data.ingredients,
      is_available: data.is_available,
      sort_order: data.sort_order,
    });

    return { success: true, data: created };
  }

  async updateMenu(id: string, data: UpdateMenuRequest): Promise<ApiResponse<Menu>> {
    const patch: Partial<Menu> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.item_type !== undefined) patch.item_type = data.item_type;
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.unit_amount !== undefined) patch.unit_amount = data.unit_amount;
    if (data.description !== undefined) patch.description = data.description;
    if (data.price !== undefined) patch.price = data.price;
    if (data.cost_price !== undefined) patch.cost_price = data.cost_price;
    if (data.category !== undefined) patch.category_id = data.category;
    if (data.cook_time_minutes !== undefined) patch.cook_time_minutes = data.cook_time_minutes;
    if (data.ingredients !== undefined) patch.ingredients = data.ingredients;
    if (data.is_available !== undefined) patch.is_available = data.is_available;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    if (typeof data.image === 'string') patch.image_url = data.image;

    const updated = mockStore.updateMenu(id, patch);
    if (!updated) {
      return { success: false, error: { message: 'Taom topilmadi' } };
    }
    return { success: true, data: updated };
  }

  async deleteMenu(id: string): Promise<ApiResponse<void>> {
    mockStore.deleteMenu(id);
    return { success: true, data: undefined };
  }

  async toggleAvailable(id: string, isAvailable: boolean): Promise<ApiResponse<Menu>> {
    const updated = mockStore.updateMenu(id, { is_available: !isAvailable });
    if (!updated) {
      return { success: false, error: { message: 'Taom topilmadi' } };
    }
    return { success: true, data: updated };
  }

  async toggleAvailability(id: string, current: boolean): Promise<ApiResponse<Menu>> {
    return this.toggleAvailable(id, current);
  }
}

export const menuService = new MenuService();
