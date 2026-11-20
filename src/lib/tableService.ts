// ─── Table Service (Demo / Mock Mode) ─────────────────────────────────────────

import { ApiResponse } from './api';
import { Table } from './types';
import { mockStore } from './mockStore';

export interface CreateTableRequest {
  organization?: string;
  table_number: number;
  assigned_waiter?: string;
  is_active?: boolean;
}

export interface UpdateTableRequest {
  table_number?: number;
  assigned_waiter?: string;
  is_active?: boolean;
}

class TableService {
  async getTables(): Promise<ApiResponse<Table[]>> {
    const data = mockStore.getTables();
    return { success: true, data };
  }

  async createTable(data: CreateTableRequest): Promise<ApiResponse<Table>> {
    const table = mockStore.createTable(data.table_number, data.assigned_waiter);
    return { success: true, data: table };
  }

  async createTablesBulk(count: number): Promise<ApiResponse<Table[]>> {
    const tables = mockStore.createTablesBulk(count);
    return { success: true, data: tables };
  }

  async updateTable(id: string, data: UpdateTableRequest): Promise<ApiResponse<Table>> {
    const updated = mockStore.updateTable(id, {
      table_number: data.table_number,
      assigned_waiter_id: data.assigned_waiter,
      is_active: data.is_active,
    });
    if (!updated) {
      return { success: false, error: { message: 'Stol topilmadi' } };
    }
    return { success: true, data: updated };
  }

  async deleteTable(id: string): Promise<ApiResponse<void>> {
    mockStore.deleteTable(id);
    return { success: true, data: undefined };
  }

  async assignWaiter(tableId: string, waiterId: string | null): Promise<ApiResponse<Table>> {
    const updated = mockStore.assignWaiterToTable(tableId, waiterId);
    if (!updated) {
      return { success: false, error: { message: 'Stol topilmadi' } };
    }
    return { success: true, data: updated };
  }

  async toggleActive(id: string, isActive: boolean): Promise<ApiResponse<Table>> {
    const updated = mockStore.updateTable(id, { is_active: !isActive });
    if (!updated) {
      return { success: false, error: { message: 'Stol topilmadi' } };
    }
    return { success: true, data: updated };
  }
}

export const tableService = new TableService();
