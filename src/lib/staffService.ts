// ─── Staff Service (Manager API) ──────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { UserProfile, UserRole } from './types';

export interface CreateStaffRequest {
  organization?: string;
  username: string;
  password: string; // password is required for new employees
  full_name: string;
  role: 'chef' | 'waiter';
  email?: string;
  pin_code?: string; // 6-digit PIN for chef
  monthly_salary?: number; // in tiyin
  is_active?: boolean;
}

export interface UpdateStaffRequest {
  username?: string;
  password?: string;
  full_name?: string;
  role?: 'chef' | 'waiter';
  email?: string;
  pin_code?: string;
  monthly_salary?: number;
  is_active?: boolean;
}

function mapStaff(s: any): UserProfile {
  return {
    id: String(s.user_id || s.id),
    organization_id: s.organization_id || s.organization,
    username: s.username,
    full_name: s.full_name || s.username,
    role: s.role as UserRole,
    monthly_salary: s.monthly_salary || 0, // already in tiyin
    is_active: s.is_active ?? true,
    email: s.email,
  };
}

class StaffService {
  private cache: { data: UserProfile[]; timestamp: number } | null = null;
  private inFlight: Promise<ApiResponseEnvelope<UserProfile[]>> | null = null;

  invalidateCache() {
    this.cache = null;
  }

  async getStaff(force = false): Promise<ApiResponseEnvelope<UserProfile[]>> {
    const TTL = 2 * 60 * 1000; // 2 minutes

    if (!force && this.cache && Date.now() - this.cache.timestamp < TTL) {
      return { success: true, data: this.cache.data };
    }

    if (this.inFlight && !force) {
      return this.inFlight;
    }

    const run = (async () => {
      try {
        const res = await managerApi.staff.getStaff();
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : [];
          const mapped = items.map(mapStaff);
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

  async createStaff(data: CreateStaffRequest): Promise<ApiResponseEnvelope<UserProfile>> {
    this.invalidateCache();
    const payload = {
      username: data.username.trim(),
      full_name: data.full_name.trim(),
      role: data.role,
      password: data.password,
      pin_code: data.role === 'chef' ? (data.pin_code || data.password?.slice(0, 6)) : undefined,
      monthly_salary: data.monthly_salary || 0, // in tiyin
      is_active: data.is_active ?? true,
    };

    const res = await managerApi.staff.createStaff(payload);
    if (res.success && res.data) {
      return { success: true, data: mapStaff(res.data) };
    }

    return { success: false, error: res.error };
  }

  async updateStaff(id: string, data: UpdateStaffRequest): Promise<ApiResponseEnvelope<UserProfile>> {
    this.invalidateCache();
    const res = await managerApi.staff.updateStaff(id, data);
    if (res.success && res.data) {
      return { success: true, data: mapStaff(res.data) };
    }

    return { success: false, error: res.error };
  }

  async deleteStaff(id: string): Promise<ApiResponseEnvelope<void>> {
    this.invalidateCache();
    const res = await managerApi.staff.deleteStaff(id);
    return { success: res.success, error: res.error, data: undefined };
  }

  async toggleActive(id: string, isActive: boolean): Promise<ApiResponseEnvelope<UserProfile>> {
    return this.updateStaff(id, { is_active: !isActive });
  }
}

export const staffService = new StaffService();
