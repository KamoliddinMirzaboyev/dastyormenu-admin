// ─── API Types & Response Envelope ──────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export const API_MESSAGES = {
  NETWORK_ERROR: 'Internet aloqasi mavjud emas',
  TIMEOUT_ERROR: 'So\'rov vaqti tugadi',
  SERVER_ERROR: 'Serverda xatolik yuz berdi',
  UNAUTHORIZED: 'Avtorizatsiyadan o\'tilmagan',
  FORBIDDEN: 'Ruxsat berilmagan',
  NOT_FOUND: 'Ma\'lumot topilmadi',
  ERROR: 'Xatolik yuz berdi',
} as const;
