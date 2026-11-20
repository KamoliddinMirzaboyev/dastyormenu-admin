// ─── API Client (Unified via Manager API Client) ──────────────────────────────

import { managerApi, ApiResponseEnvelope, ApiErrorPayload } from './managerClient';

export type ApiError = ApiErrorPayload;
export type ApiResponse<T = unknown> = ApiResponseEnvelope<T>;

export const API_MESSAGES = {
  NETWORK_ERROR: 'Internet aloqasi mavjud emas',
  TIMEOUT_ERROR: "So'rov vaqti tugadi",
  SERVER_ERROR: 'Serverda xatolik yuz berdi',
  UNAUTHORIZED: "Avtorizatsiyadan o'tilmagan yoki token eskirgan",
  FORBIDDEN: 'Ruxsat berilmagan',
  NOT_FOUND: "Ma'lumot topilmadi",
  ERROR: 'Xatolik yuz berdi',
  SUCCESS: 'Muvaffaqiyatli bajarildi',
} as const;

export const apiClient = managerApi;
export default apiClient;
