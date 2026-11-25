// ─── Dastyor Manager API Client ───────────────────────────────────────────────
// Implements the official specification for https://dastyor-menu-admin.vercel.app/manager
// Target: https://dastroymenu.abboskhoja.uz/api/manager/

export interface ApiErrorPayload {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export interface ClientConfig {
  baseURL?: string;
  timeout?: number;
}

export class ManagerClient {
  private baseURL: string;
  private timeout: number;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(config: ClientConfig = {}) {
    const rawUrl = (
      config.baseURL ||
      import.meta.env.VITE_MANAGER_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'https://dastroymenu.abboskhoja.uz/api/manager/'
    ).trim();

    // Ensure trailing slash for clean endpoint concatenation
    this.baseURL = rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
    this.timeout = config.timeout || Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
  }

  // Token management
  public getToken(): string | null {
    return localStorage.getItem('dastyor_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('dastyor_refresh_token');
  }

  public setTokens(access: string, refresh?: string | null) {
    localStorage.setItem('dastyor_token', access);
    if (refresh) {
      localStorage.setItem('dastyor_refresh_token', refresh);
    }
  }

  public clearTokens() {
    localStorage.removeItem('dastyor_token');
    localStorage.removeItem('dastyor_refresh_token');
    localStorage.removeItem('dastyor_auth');
  }

  public handleUnauthorized() {
    this.clearTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  private extractErrorMessage(resJson: any): string {
    if (!resJson || typeof resJson !== 'object') {
      return 'Serverda xatolik yuz berdi.';
    }
    if (typeof resJson.detail === 'string') return resJson.detail;
    if (typeof resJson.message === 'string') return resJson.message;
    if (resJson.error) {
      if (typeof resJson.error === 'string') return resJson.error;
      if (resJson.error.details && typeof resJson.error.details === 'object') {
        const nested = this.extractErrorMessage(resJson.error.details);
        if (nested !== 'Serverda xatolik yuz berdi.') return nested;
      }
      if (resJson.error.message) return String(resJson.error.message);
    }
    if (Array.isArray(resJson.non_field_errors) && resJson.non_field_errors.length > 0) {
      return String(resJson.non_field_errors[0]);
    }
    const fieldErrors: string[] = [];
    for (const [key, val] of Object.entries(resJson)) {
      if (key === 'success' || key === 'status' || key === 'code') continue;
      if (Array.isArray(val) && val.length > 0) {
        fieldErrors.push(`${key}: ${val[0]}`);
      } else if (typeof val === 'string') {
        fieldErrors.push(`${key}: ${val}`);
      } else if (val && typeof val === 'object') {
        const sub = this.extractErrorMessage(val);
        if (sub !== 'Serverda xatolik yuz berdi.') {
          fieldErrors.push(`${key}: ${sub}`);
        }
      }
    }
    return fieldErrors.length > 0 ? fieldErrors.join('; ') : 'Serverda xatolik yuz berdi.';
  }

  private onTokenRefreshed(newToken: string) {
    this.refreshSubscribers.forEach((cb) => cb(newToken));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  /**
   * Refresh token rotation: exchanges old refresh token for new access and refresh tokens.
   */
  public async refreshAccessToken(): Promise<string | null> {
    const currentRefresh = this.getRefreshToken();
    if (!currentRefresh) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refresh_token: currentRefresh }),
      });

      const resJson: ApiResponseEnvelope<{ access_token: string; refresh_token?: string }> =
        await response.json().catch(() => null);

      if (response.ok && resJson?.success && resJson.data?.access_token) {
        this.setTokens(resJson.data.access_token, resJson.data.refresh_token || null);
        return resJson.data.access_token;
      }

      this.clearTokens();
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Main request runner
   */
  public async request<T = unknown>(
    endpoint: string,
    options: RequestInit & {
      params?: Record<string, string | number | boolean | undefined | null>;
      idempotencyKey?: string;
    } = {}
  ): Promise<ApiResponseEnvelope<T>> {
    // Strip leading slash so it appends cleanly to baseURL
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    let url = `${this.baseURL}${cleanEndpoint}`;

    // Append Query Parameters
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryStr = searchParams.toString();
      if (queryStr) {
        url += (url.includes('?') ? '&' : '?') + queryStr;
      }
    }

    const headers = new Headers(options.headers || {});

    // Default JSON headers
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Attach Bearer Token if present
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Idempotency-Key if provided
    if (options.idempotencyKey) {
      headers.set('Idempotency-Key', options.idempotencyKey);
    }

    // Timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      let response = await fetch(url, {
        ...options,
        cache: options.cache ?? 'no-store',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 with Token Refresh
      const isAuthPath = cleanEndpoint.startsWith('auth/login') || cleanEndpoint.startsWith('auth/refresh');
      if (response.status === 401 && !isAuthPath) {
        if (this.getRefreshToken()) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            const newToken = await this.refreshAccessToken();
            this.isRefreshing = false;

            if (newToken) {
              this.onTokenRefreshed(newToken);
              headers.set('Authorization', `Bearer ${newToken}`);
              response = await fetch(url, { ...options, cache: options.cache ?? 'no-store', headers });
            } else {
              this.handleUnauthorized();
              return {
                success: false,
                error: {
                  message: "Avtorizatsiyadan o'tilmagan yoki sessiya muddati tugagan.",
                  code: '401',
                },
              };
            }
          } else {
            return new Promise<ApiResponseEnvelope<T>>((resolve) => {
              this.addRefreshSubscriber(async (newToken) => {
                headers.set('Authorization', `Bearer ${newToken}`);
                try {
                  const res = await fetch(url, { ...options, cache: options.cache ?? 'no-store', headers });
                  const json = await res.json().catch(() => null);
                  resolve(json || { success: res.ok, data: json });
                } catch (err) {
                  resolve({
                    success: false,
                    error: { message: err instanceof Error ? err.message : 'Tarmoq xatoligi' },
                  });
                }
              });
            });
          }
        } else {
          this.handleUnauthorized();
          return {
            success: false,
            error: {
              message: "Avtorizatsiyadan o'tilmagan yoki sessiya muddati tugagan.",
              code: '401',
            },
          };
        }
      }

      if (response.status === 204) {
        return { success: true, data: undefined as unknown as T };
      }

      const resJson = await response.json().catch(() => null);

      if (resJson && typeof resJson.success === 'boolean') {
        if (!resJson.success) {
          const detailed = this.extractErrorMessage(resJson);
          return {
            ...resJson,
            error: {
              ...(resJson.error || {}),
              message:
                detailed !== 'Serverda xatolik yuz berdi.'
                  ? detailed
                  : resJson.error?.message || "So'rovni tekshiring.",
            },
          } as ApiResponseEnvelope<T>;
        }
        return resJson as ApiResponseEnvelope<T>;
      }

      if (response.ok) {
        return { success: true, data: resJson as T };
      }

      return {
        success: false,
        error: {
          message: this.extractErrorMessage(resJson),
          code: String(response.status),
          details: resJson,
        },
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        return {
          success: false,
          error: { message: "So'rov vaqti tugadi (Timeout)", code: 'TIMEOUT' },
        };
      }

      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Internet aloqasi mavjud emas",
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // ─── Module APIs ────────────────────────────────────────────────────────────

  public auth = {
    login: (credentials: { login: string; password: string; organization?: string }) =>
      this.request<{
        access_token: string;
        refresh_token: string;
        user: any;
        organization: any;
      }>('auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    refresh: (refreshToken: string) =>
      this.request<{ access_token: string; refresh_token: string }>('auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),

    logout: (refreshToken?: string) =>
      this.request('auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken || this.getRefreshToken() || '' }),
      }),

    getProfile: () => this.request<{ user: any; organization: any }>('profile/'),

    updateProfile: (data: { full_name?: string; email?: string }) =>
      this.request('profile/', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    changePassword: (data: { current: string; new: string; confirm: string }) =>
      this.request('password/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  public dashboard = {
    getDashboard: (period: string = 'today') =>
      this.request<any>('dashboard/', { params: { period } }),
  };

  public orders = {
    getOrders: (params?: { status?: string; tableId?: string; date?: string; page?: number }) =>
      this.request<any[]>('orders/', { params }),

    getOrder: (id: string) => this.request<any>(`orders/${id}/`),

    createOrder: (payload: {
      table_id: string;
      waiter_id?: string | null;
      customer_note?: string | null;
      tip_percentage?: number;
      items: Array<{ menu_id: string; quantity: number; modifications?: string | null }>;
    }) =>
      this.request<any>('orders/', {
        method: 'POST',
        body: JSON.stringify(payload),
        idempotencyKey: crypto.randomUUID(),
      }),

    updateStatus: (id: string, status: string, reason?: string) =>
      this.request<any>(`orders/${id}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),

    deleteOrder: (id: string) =>
      this.request(`orders/${id}/`, {
        method: 'DELETE',
      }),
  };

  public categories = {
    getCategories: () => this.request<any[]>('categories/'),

    createCategory: (data: { name: string; icon?: string; sort_order?: number; is_active?: boolean }) =>
      this.request<any>('categories/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateCategory: (id: string, data: Partial<{ name: string; icon: string; sort_order: number; is_active: boolean }>) =>
      this.request<any>(`categories/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteCategory: (id: string) =>
      this.request(`categories/${id}/`, {
        method: 'DELETE',
      }),
  };

  public menu = {
    getMenu: (params?: { category?: string; item_type?: string; search?: string }) =>
      this.request<any[]>('menu/', { params }),

    createMenu: (data: any) =>
      this.request<any>('menu/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateMenu: (id: string, data: any) =>
      this.request<any>(`menu/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteMenu: (id: string) =>
      this.request(`menu/${id}/`, {
        method: 'DELETE',
      }),

    toggleAvailability: (id: string, is_available: boolean) =>
      this.request<any>(`menu/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available }),
      }),
  };

  public tables = {
    getTables: () => this.request<any[]>('tables/'),

    createTable: (data: { table_number: number; assigned_waiter?: string | null; is_active?: boolean }) =>
      this.request<any>('tables/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createTablesBulk: (count: number) =>
      this.request<any[]>('tables/bulk/', {
        method: 'POST',
        body: JSON.stringify({ count }),
      }),

    updateTable: (id: string, data: any) =>
      this.request<any>(`tables/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteTable: (id: string) =>
      this.request(`tables/${id}/`, {
        method: 'DELETE',
      }),

    getQrCodeUrl: (tableId: string) => `https://dastroymenu.abboskhoja.uz/api/tables/${tableId}/qr/`,
  };

  public staff = {
    getStaff: () => this.request<any[]>('staff/'),

    createStaff: (data: {
      username: string;
      full_name: string;
      role: 'chef' | 'waiter';
      password: string;
      email?: string;
      pin_code?: string;
      monthly_salary?: number;
      is_active?: boolean;
    }) =>
      this.request<any>('staff/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStaff: (id: string, data: any) =>
      this.request<any>(`staff/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteStaff: (id: string) =>
      this.request(`staff/${id}/`, {
        method: 'DELETE',
      }),
  };

  public expenses = {
    getExpenses: (params?: { date?: string; category?: string }) =>
      this.request<any[]>('expenses/', { params }),

    createExpense: (data: {
      category: 'ingredients' | 'salary' | 'utilities' | 'rent' | 'household' | 'other';
      title: string;
      amount: number;
      date: string;
      note?: string;
    }) =>
      this.request<any>('expenses/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateExpense: (id: string, data: any) =>
      this.request<any>(`expenses/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteExpense: (id: string) =>
      this.request(`expenses/${id}/`, {
        method: 'DELETE',
      }),
  };

  public reports = {
    getReport: (params: { period: string; start_date?: string; end_date?: string }) =>
      this.request<any>('reports/', { params }),
  };

  public organization = {
    getOrganization: () => this.request<any>('organization/'),

    updateOrganization: (data: { name?: string; address?: string; phone?: string; logo_url?: string }) =>
      this.request<any>('organization/', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };
}

export function createManagerClient(config?: ClientConfig): ManagerClient {
  return new ManagerClient(config);
}

export const managerApi = createManagerClient();
