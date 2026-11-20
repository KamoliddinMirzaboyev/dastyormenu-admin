// ─── Auth Service (Manager API) ───────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { UserProfile, Organization } from './types';

export interface LoginRequest {
  login: string;
  password: string;
  organization?: string;
}

export interface PasswordChangeRequest {
  current: string;
  new: string;
  confirm: string;
}

class AuthService {
  /**
   * Login with username/email and password via POST /api/manager/auth/login/
   */
  async login(credentials: LoginRequest): Promise<ApiResponseEnvelope<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
    organization: Organization;
  }>> {
    const login = (credentials.login || '').trim();
    const password = (credentials.password || '').trim();

    try {
      const res = await managerApi.auth.login({
        login,
        password,
        organization: credentials.organization,
      });

      if (res.success && res.data?.access_token) {
        managerApi.setTokens(res.data.access_token, res.data.refresh_token);

        const user: UserProfile = {
          id: String(res.data.user?.id || '1'),
          username: res.data.user?.username || login,
          full_name: res.data.user?.full_name || login,
          role: res.data.user?.role || 'manager',
          is_active: res.data.user?.is_active ?? true,
          organization_id: res.data.organization?.id,
        };

        const organization: Organization = {
          id: res.data.organization?.id || 'org-1',
          name: res.data.organization?.name || 'Dastyor Restoran',
          full_name: res.data.organization?.full_name || res.data.organization?.name,
          address: res.data.organization?.address,
          phone: res.data.organization?.phone,
          logo_url: res.data.organization?.logo_url,
          is_active: true,
        };

        localStorage.setItem('dastyor_auth', JSON.stringify({ user, organization }));

        return {
          success: true,
          data: {
            access_token: res.data.access_token,
            refresh_token: res.data.refresh_token,
            user,
            organization,
          },
        };
      }

      return {
        success: false,
        error: res.error || {
          message: "Login yoki parol noto'g'ri",
          code: 'INVALID_CREDENTIALS',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Tarmoq xatoligi yuz berdi",
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * Logout via POST /api/manager/auth/logout/
   */
  async logout(): Promise<void> {
    const refreshToken = managerApi.getRefreshToken();
    if (refreshToken) {
      try {
        await managerApi.auth.logout(refreshToken);
      } catch (e) {
        console.warn('Logout error (safe to ignore):', e);
      }
    }
    this.clearAuthData();
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<ApiResponseEnvelope<{ access_token: string }>> {
    const newAccess = await managerApi.refreshAccessToken();
    if (newAccess) {
      return { success: true, data: { access_token: newAccess } };
    }

    return {
      success: false,
      error: { message: "Tokenni yangilab bo'lmadi", code: '401' },
    };
  }

  /**
   * Get user session & profile: GET /api/manager/profile/
   */
  async getProfile(): Promise<ApiResponseEnvelope<UserProfile>> {
    const token = managerApi.getToken();
    if (!token) {
      return { success: false, error: { message: "Avtorizatsiyadan o'tilmagan" } };
    }

    const res = await managerApi.auth.getProfile();
    if (res.success && res.data) {
      const user: UserProfile = {
        id: String(res.data.user?.id || '1'),
        username: res.data.user?.username || '',
        full_name: res.data.user?.full_name || res.data.user?.username || '',
        role: res.data.user?.role || 'manager',
        organization_id: res.data.organization?.id,
        is_active: res.data.user?.is_active ?? true,
      };

      if (res.data.organization) {
        const stored = this.getStoredAuth() || { user, organization: res.data.organization };
        localStorage.setItem(
          'dastyor_auth',
          JSON.stringify({ ...stored, user, organization: res.data.organization })
        );
      }

      return { success: true, data: user };
    }

    return { success: false, error: res.error };
  }

  /**
   * Update profile: PATCH /api/manager/profile/
   */
  async updateProfile(data: { full_name?: string; email?: string }): Promise<ApiResponseEnvelope<UserProfile>> {
    const res = await managerApi.auth.updateProfile(data);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    const stored = this.getStoredAuth();
    if (stored?.user) {
      const updatedUser = { ...stored.user, ...data };
      localStorage.setItem('dastyor_auth', JSON.stringify({ ...stored, user: updatedUser }));
      return { success: true, data: updatedUser };
    }

    return { success: false, error: { message: "Profil topilmadi" } };
  }

  /**
   * Change password: POST /api/manager/password/
   */
  async changePassword(data: PasswordChangeRequest): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.auth.changePassword(data);
    if (res.success) {
      this.clearAuthData();
    }
    return res;
  }

  async verifyAuth(): Promise<boolean> {
    const token = managerApi.getToken();
    if (!token) return false;

    const res = await managerApi.auth.getProfile();
    return res.success;
  }

  getStoredAuth(): { user: UserProfile; organization: Organization } | null {
    try {
      const auth = localStorage.getItem('dastyor_auth');
      return auth ? JSON.parse(auth) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return managerApi.getToken();
  }

  clearAuthData(): void {
    managerApi.clearTokens();
  }
}

export const authService = new AuthService();
