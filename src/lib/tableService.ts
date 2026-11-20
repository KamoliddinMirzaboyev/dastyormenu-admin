// ─── Table Service (Manager API) ──────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { Table } from './types';

export interface CreateTableRequest {
  organization?: string;
  table_number: number;
  assigned_waiter?: string | null;
  is_active?: boolean;
}

export interface UpdateTableRequest {
  table_number?: number;
  assigned_waiter?: string | null;
  is_active?: boolean;
}

function mapTable(t: any): Table {
  return {
    id: t.id,
    organization_id: t.organization_id || t.organization,
    table_number: t.table_number,
    assigned_waiter_id: t.assigned_waiter_id || (t.assigned_waiter ? String(t.assigned_waiter) : null),
    waiter_name: t.waiter_name || null,
    is_active: t.is_active ?? true,
    qr_code_id: t.qr_code_id,
    qr_code_url: t.qr_code_url || managerApi.tables.getQrCodeUrl(t.id),
  };
}

class TableService {
  async getTables(): Promise<ApiResponseEnvelope<Table[]>> {
    const res = await managerApi.tables.getTables();
    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items.map(mapTable) };
    }
    return { success: false, error: res.error };
  }

  async createTable(data: CreateTableRequest): Promise<ApiResponseEnvelope<Table>> {
    const res = await managerApi.tables.createTable({
      table_number: data.table_number,
      assigned_waiter: data.assigned_waiter || null,
      is_active: data.is_active ?? true,
    });

    if (res.success && res.data) {
      return { success: true, data: mapTable(res.data) };
    }

    return { success: false, error: res.error };
  }

  async createTablesBulk(count: number): Promise<ApiResponseEnvelope<Table[]>> {
    const res = await managerApi.tables.createTablesBulk(count);
    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      return { success: true, data: items.map(mapTable) };
    }

    return { success: false, error: res.error };
  }

  async updateTable(id: string, data: UpdateTableRequest): Promise<ApiResponseEnvelope<Table>> {
    const res = await managerApi.tables.updateTable(id, {
      table_number: data.table_number,
      assigned_waiter: data.assigned_waiter !== undefined ? data.assigned_waiter : undefined,
      is_active: data.is_active,
    });

    if (res.success && res.data) {
      return { success: true, data: mapTable(res.data) };
    }

    return { success: false, error: res.error };
  }

  async deleteTable(id: string): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.tables.deleteTable(id);
    return { success: res.success, error: res.error, data: undefined };
  }

  async assignWaiter(tableId: string, waiterId: string | null): Promise<ApiResponseEnvelope<Table>> {
    return this.updateTable(tableId, { assigned_waiter: waiterId });
  }

  async toggleActive(id: string, isActive: boolean): Promise<ApiResponseEnvelope<Table>> {
    return this.updateTable(id, { is_active: !isActive });
  }

  getQrCodeUrl(tableId: string): string {
    return managerApi.tables.getQrCodeUrl(tableId);
  }
}

export const tableService = new TableService();
