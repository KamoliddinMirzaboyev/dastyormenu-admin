// ─── Staff Service (Demo / Mock Mode) ─────────────────────────────────────────

import { ApiResponse } from './api';
import { UserProfile } from './types';
import { mockStore } from './mockStore';

export interface CreateStaffRequest {
  organization?: string;
  username: string;
  password?: string;
  full_name: string;
  role: 'manager' | 'chef' | 'waiter';
  email?: string;
  pin_code?: string;
  monthly_salary?: number;
  is_active?: boolean;
}

export interface UpdateStaffRequest {
  username?: string;
  password?: string;
  full_name?: string;
  role?: 'manager' | 'chef' | 'waiter';
  email?: string;
  pin_code?: string;
  monthly_salary?: number;
  is_active?: boolean;
}

class StaffService {
  async getStaff(): Promise<ApiResponse<UserProfile[]>> {
    const data = mockStore.getStaff();
    return { success: true, data };
  }

  async createStaff(data: CreateStaffRequest): Promise<ApiResponse<UserProfile>> {
    const staff = mockStore.createStaff({
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      email: data.email,
      pin_code: data.pin_code || data.password || '1111',
      monthly_salary: data.monthly_salary,
      is_active: data.is_active,
    });
    return { success: true, data: staff };
  }

  async updateStaff(id: string, data: UpdateStaffRequest): Promise<ApiResponse<UserProfile>> {
    const patch: Partial<UserProfile> = {};
    if (data.username !== undefined) patch.username = data.username;
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.role !== undefined) patch.role = data.role;
    if (data.email !== undefined) patch.email = data.email;
    if (data.pin_code !== undefined) patch.pin_code = data.pin_code;
    if (data.monthly_salary !== undefined) patch.monthly_salary = data.monthly_salary;
    if (data.is_active !== undefined) patch.is_active = data.is_active;

    const updated = mockStore.updateStaff(id, patch);
    if (!updated) {
      return { success: false, error: { message: 'Xodim topilmadi' } };
    }
    return { success: true, data: updated };
  }

  async deleteStaff(id: string): Promise<ApiResponse<void>> {
    mockStore.deleteStaff(id);
    return { success: true, data: undefined };
  }

  async toggleActive(id: string, isActive: boolean): Promise<ApiResponse<UserProfile>> {
    const updated = mockStore.updateStaff(id, { is_active: !isActive });
    if (!updated) {
      return { success: false, error: { message: 'Xodim topilmadi' } };
    }
    return { success: true, data: updated };
  }
}

export const staffService = new StaffService();
