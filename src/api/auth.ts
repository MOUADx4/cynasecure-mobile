import { apiFetch, apiBaseUrl, clearSession } from './apiFetch';

const rootUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  emailVerifiedAt: string | null;
  totpEnabled: boolean;
  phone?: string;
  company?: string;
  createdAt?: string;
};

export const authApi = {
  me: () => apiFetch<User>('/me'),

  login: async (email: string, password: string, rememberMe = false) => {
    const data = await apiFetch<any>('/login', {
      method: 'POST',
      body: { email, password, rememberMe },
    });
    // Support both { token, user: {...} } (old) and flat user object (new)
    const user = (data?.user && typeof data.user === 'object') ? data.user : data;
    return {
      ...user,
      requires2fa: data?.requires2fa ?? user?.requires2fa,
      emailUnverified: data?.emailUnverified ?? user?.emailUnverified,
    } as User & { requires2fa?: boolean; emailUnverified?: boolean };
  },

  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    apiFetch<{ message: string; needsVerification?: boolean }>('/register', {
      method: 'POST',
      body: data,
    }),

  logout: async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      await clearSession();
    }
  },

  forgotPassword: (email: string) =>
    apiFetch('/password-reset/request', { method: 'POST', body: { email } }),

  resendVerification: (email: string) =>
    apiFetch('/auth/resend-verification', { method: 'POST', body: { email } }),

  verifyEmail: (token: string) =>
    apiFetch('/auth/verify-email', { method: 'POST', body: { token } }),

  verifyTotp: (code: string) =>
    apiFetch<User>(`${rootUrl}/2fa_check`, { method: 'POST', body: { code } }),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; company?: string }) =>
    apiFetch<User>('/me', { method: 'PATCH', body: data }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ message: string }>('/me/password', { method: 'PATCH', body: data }),

  requestEmailChange: (currentPassword: string, newEmail: string) =>
    apiFetch<{ message: string }>('/me/email/request-change', {
      method: 'POST',
      body: { currentPassword, newEmail },
    }),

  twoFactorStatus: () =>
    apiFetch<{ enabled: boolean }>('/me/2fa/status'),

  twoFactorSetup: () =>
    apiFetch<{ secret: string; qrContent: string }>('/me/2fa/setup', { method: 'POST' }),

  twoFactorConfirm: (code: string) =>
    apiFetch<{ message: string }>('/me/2fa/confirm', { method: 'POST', body: { code } }),

  twoFactorDisable: (password: string, code: string) =>
    apiFetch<{ message: string }>('/me/2fa/disable', {
      method: 'POST',
      body: { password, code },
    }),

  verifyEmailChange: (token: string) =>
    apiFetch('/email/verify-change', { method: 'POST', body: { token } }),
};
