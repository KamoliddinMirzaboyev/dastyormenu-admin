// ─── Auth Service (Demo / Mock Mode) ──────────────────────────────────────────

import { ApiResponse } from './api';
import { LoginResponse, RefreshTokenResponse } from './apiTypes';
import { UserProfile, Organization } from './types';
import { mockStore } from './mockStore';

export interface LoginRequest {
  login: string;
  password: string;
}

class AuthService {
  /**
   * Login with username/email and password.
   * Configured for demo credentials: admin / 1234
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const cleanLogin = (credentials.login || '').trim().toLowerCase();
    const cleanPass = (credentials.password || '').trim();

    // Check for demo admin credentials
    const isDemoAdmin = (cleanLogin === 'admin' || cleanLogin === 'admin@dastyor.uz') && cleanPass === '1234';
    
    // Also accept staff members login if needed
    const staffMatch = mockStore.getStaff().find(s => 
      (s.username.toLowerCase() === cleanLogin || s.email?.toLowerCase() === cleanLogin) && 
      (s.pin_code === cleanPass || cleanPass === '1234')
    );

    if (isDemoAdmin || staffMatch) {
      const user: UserProfile = isDemoAdmin ? mockStore.getAdminUser() : staffMatch!;
      const organization: Organization = mockStore.getOrganization();

      const access_token = 'demo_access_token_' + Date.now();
      const refresh_token = 'demo_refresh_token_' + Date.now();

      const transformedData: LoginResponse = {
        access_token,
        refresh_token,
        user,
        organization,
      };

      // Save to localStorage
      localStorage.setItem('dastyor_token', access_token);
      localStorage.setItem('dastyor_refresh_token', refresh_token);
      localStorage.setItem('dastyor_auth', JSON.stringify({ user, organization }));

      return {
        success: true,
        data: transformedData,
      };
    }

    return {
      success: false,
      error: {
        message: 'Login yoki parol noto\'g\'ri! Demo login: admin, parol: 1234',
        code: 'INVALID_CREDENTIALS',
      },
    };
  }

  /**
   * Logout and clear all auth data
   */
  async logout(): Promise<void> {
    this.clearAuthData();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const access_token = 'demo_access_token_' + Date.now();
    localStorage.setItem('dastyor_token', access_token);
    return {
      success: true,
      data: { access_token },
    };
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const user = mockStore.getAdminUser();
    return {
      success: true,
      data: user,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const updated = mockStore.updateAdminUser(data);
    const stored = this.getStoredAuth();
    if (stored) {
      stored.user = updated;
      localStorage.setItem('dastyor_auth', JSON.stringify(stored));
    }
    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Check if token is valid
   */
  async verifyAuth(): Promise<boolean> {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Get stored auth data from localStorage
   */
  getStoredAuth(): { user: UserProfile; organization: Organization } | null {
    try {
      const data = localStorage.getItem('dastyor_auth');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading auth data from localStorage:', e);
    }
    return null;
  }

  /**
   * Get access token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('dastyor_token');
  }

  /**
   * Clear all auth data from localStorage
   */
  clearAuthData(): void {
    localStorage.removeItem('dastyor_token');
    localStorage.removeItem('dastyor_refresh_token');
    localStorage.removeItem('dastyor_auth');
  }
}

export const authService = new AuthService();
