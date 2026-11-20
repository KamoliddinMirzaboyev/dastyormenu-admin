// ─── Order Service (Manager API) ──────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { Order, OrderStatus, OrderItem } from './types';

export interface GetOrdersParams {
  status?: OrderStatus | 'all';
  date?: string; // YYYY-MM-DD
  tableId?: string;
  page?: number;
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
  tip_percentage?: number;
  status?: OrderStatus;
}

function mapOrder(o: any): Order {
  const orderItems: OrderItem[] = (o.order_items || o.items || []).map((item: any, idx: number) => ({
    id: item.id || `${o.id}-item-${idx}`,
    order_id: o.id,
    menu_id: item.menu_id || item.menu_item_id || '',
    menu_name: item.menu_name || item.name || 'Taom',
    menu_price: item.menu_price || item.unit_price || 0, // in tiyin
    cost_price: item.cost_price || 0,
    quantity: item.quantity || 1,
    modifications: item.modifications || null,
    item_status: item.item_status || o.status,
  }));

  return {
    id: o.id,
    organization_id: o.organization_id || o.organization,
    table_id: o.table_id || o.table?.id || '',
    table_number: o.table_number || o.table?.table_number,
    waiter_id: o.waiter_id || o.waiter?.id || null,
    waiter_name: o.waiter_name || o.waiter?.full_name || null,
    status: o.status,
    priority: o.priority ?? 0,
    payment_status: o.payment_status,
    total_amount: o.total_amount || 0, // in tiyin
    tip_amount: o.tip_amount || 0,
    tip_percentage: o.tip_percentage || 0,
    grand_total: o.grand_total || (o.total_amount || 0) + (o.tip_amount || 0),
    customer_note: o.customer_note || null,
    created_at: o.created_at,
    completed_at: o.completed_at || null,
    order_items: orderItems,
    items: o.items || o.order_items,
    table: o.table || {
      id: o.table_id,
      table_number: o.table_number || 1,
      is_active: true,
    },
    waiter: o.waiter,
  };
}

class OrderService {
  async getOrders(params: GetOrdersParams = {}): Promise<ApiResponseEnvelope<Order[]>> {
    const queryParams: Record<string, string | number> = {};
    if (params.status && params.status !== 'all') queryParams.status = params.status;
    if (params.tableId) queryParams.tableId = params.tableId;
    if (params.date) queryParams.date = params.date;
    if (params.page) queryParams.page = params.page;

    const res = await managerApi.orders.getOrders(queryParams);

    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items.map(mapOrder) };
    }

    return { success: false, error: res.error };
  }

  async createOrder(payload: CreateOrderPayload): Promise<ApiResponseEnvelope<Order>> {
    const res = await managerApi.orders.createOrder({
      table_id: payload.table_id,
      waiter_id: payload.waiter_id || null,
      customer_note: payload.customer_note || null,
      tip_percentage: payload.tip_percentage || 10,
      items: payload.items.map((i) => ({
        menu_id: i.menu_id,
        quantity: i.quantity,
        modifications: i.modifications || null,
      })),
    });

    if (res.success && res.data) {
      return { success: true, data: mapOrder(res.data) };
    }

    return { success: false, error: res.error };
  }

  async updateStatus(id: string, status: OrderStatus, reason?: string): Promise<ApiResponseEnvelope<Order>> {
    const res = await managerApi.orders.updateStatus(id, status, reason);
    if (res.success && res.data) {
      return { success: true, data: mapOrder(res.data) };
    }

    return { success: false, error: res.error };
  }

  async deleteOrder(id: string): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.orders.deleteOrder(id);
    return { success: res.success, error: res.error, data: undefined };
  }
}

export const orderService = new OrderService();
