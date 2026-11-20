// ─── Order Service (Demo / Mock Mode) ──────────────────────────────────────────

import { ApiResponse } from './api';
import { Order, OrderStatus } from './types';
import { mockStore } from './mockStore';

export interface GetOrdersParams {
  status?: OrderStatus | 'all';
  date?: string;      // YYYY-MM-DD
  tableId?: string;
}

export interface CreateOrderPayload {
  table_id: string;
  waiter_id?: string | null;
  items: Array<{
    menu_id: string;
    quantity: number;
    modifications?: string | null;
  }>;
  customer_note?: string | null;
  status?: OrderStatus;
}

class OrderService {
  /** Fetch orders and return them matching the UI shape. */
  async getOrders(params: GetOrdersParams = {}): Promise<ApiResponse<Order[]>> {
    const data = mockStore.getOrders(params);
    return { success: true, data };
  }

  /** Update an order's status */
  async updateStatus(id: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    const updated = mockStore.updateOrderStatus(id, status);
    if (!updated) {
      return {
        success: false,
        error: { message: 'Buyurtma topilmadi', code: 'NOT_FOUND' },
      };
    }
    return { success: true, data: updated };
  }

  /** Waiter creates / accepts an order directly */
  async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    const newOrder = mockStore.createOrder(payload);
    return { success: true, data: newOrder };
  }

  /** Delete order */
  async deleteOrder(id: string): Promise<ApiResponse<void>> {
    mockStore.deleteOrder(id);
    return { success: true, data: undefined };
  }
}

export const orderService = new OrderService();
