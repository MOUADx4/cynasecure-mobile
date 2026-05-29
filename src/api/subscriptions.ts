import { apiFetch } from './apiFetch';

export type Subscription = {
  id: number;
  service: { id: number; title: string; categorySlug?: string };
  cycle: 'monthly' | 'yearly';
  price: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAYMENT_FAILED';
  startDate: string;
  nextBillingAt?: string | null;
  endDate?: string | null;
  autoRenew: boolean;
};

export type OrderItem = {
  id: number;
  serviceName: string;
  serviceType: string;
  billing: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: number;
  total: number;
  status: string;
  gateway?: string;
  createdAt: string;
  year: number;
  items: OrderItem[];
  paymentId?: number | null;
};

export const subscriptionsApi = {
  list: () => apiFetch<Subscription[]>('/subscriptions/my'),

  cancel: (id: number) =>
    apiFetch(`/subscriptions/${id}/cancel`, { method: 'PUT' }),

  renew: (id: number) =>
    apiFetch(`/subscriptions/${id}/renew`, { method: 'PUT' }),

  toggleAutoRenew: (id: number, enabled: boolean) =>
    apiFetch(`/subscriptions/${id}/auto-renew`, {
      method: 'PUT',
      body: { enabled },
    }),

  switchCycle: (id: number, cycle: 'monthly' | 'yearly') =>
    apiFetch<{ message: string; cycle: string; price: number }>(
      `/subscriptions/${id}/upgrade`,
      { method: 'PUT', body: { cycle } }
    ),
};

export const ordersApi = {
  list: (filters: { year?: number; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (filters.year) qs.set('year', String(filters.year));
    if (filters.q) qs.set('q', filters.q);
    return apiFetch<Order[]>(`/me/orders?${qs}`);
  },
};
