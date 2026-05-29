import { apiFetch } from './apiFetch';

export type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export const paymentMethodsApi = {
  list: () => apiFetch<PaymentMethod[]>('/me/payment-methods'),
  setupIntent: () => apiFetch<{ clientSecret: string }>('/me/payment-methods/setup-intent', { method: 'POST' }),
  detach: (pmId: string) => apiFetch(`/me/payment-methods/${pmId}/detach`, { method: 'DELETE' }),
  setDefault: (pmId: string) => apiFetch(`/me/payment-methods/${pmId}/default`, { method: 'POST' }),
};
