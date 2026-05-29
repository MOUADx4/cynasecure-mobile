import { apiFetch } from './apiFetch';

export type AdminStats = {
  services: number;
  users: number;
  subscriptions: number;
  mrr: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type AdminSubscription = {
  id: number;
  user: { id: number; email: string; firstName: string; lastName: string; displayName?: string };
  service: { id: number; name: string };
  cycle: string;
  price: number;
  status: string;
  startDate: string;
  nextBillingAt?: string | null;
  endDate?: string;
  autoRenew: boolean;
  invoicePaymentId?: number | null;
};

export type AdminPayment = {
  id: number;
  user: { id: number; email: string; displayName?: string; firstName?: string; lastName?: string } | null;
  service?: { id: number; name: string } | null;
  amount: number;
  cycle?: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  invoiceNumber?: string;
  fraud?: { score: number; level: 'ok' | 'review' | 'blocked' } | null;
};

export type AdminUser = {
  id: number;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string | null;
  emailVerifiedAt: string | null;
};

export type AdminService = {
  id: number;
  name: string;
  description?: string;
  longDescription?: string;
  category?: string;
  categorySlug?: string;
  type: 'saas' | 'one_shot';
  priceMonthly?: number;
  priceYearly?: number | null;
  image?: string | null;
  images?: string[];
  features?: string[];
  technicalSpecs?: { label: string; value: string }[];
  isAvailable?: boolean;
  availability?: 'available' | 'maintenance' | 'unavailable';
  trialAvailable?: boolean;
  available: boolean;
  createdAt: string;
};

export type ContactMessage = {
  id: number;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  repliedAt?: string;
};

export type AdminPromo = {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  maxUses: number | null;
  usedCount: number;
  minAmount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  appliesTo: 'all' | 'saas' | 'one_shot';
  createdAt: string;
};

export const adminApi = {
  getStats: () => apiFetch<AdminStats>('/admin/stats'),

  getSubscriptions: (page = 1) =>
    apiFetch<Paginated<AdminSubscription>>(`/admin/subscriptions?page=${page}&perPage=20`),

  cancelSubscription: (id: number) =>
    apiFetch(`/admin/subscriptions/${id}/cancel`, { method: 'PUT' }),

  getPayments: (page = 1) =>
    apiFetch<Paginated<AdminPayment>>(`/admin/payments?page=${page}&perPage=20`),

  getUsers: (page = 1) =>
    apiFetch<Paginated<AdminUser>>(`/admin/users?page=${page}&perPage=20`),

  deleteUser: (id: number) =>
    apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),

  getServices: (page = 1) =>
    apiFetch<Paginated<AdminService>>(`/admin/services?page=${page}&perPage=20`),

  getService: (id: number) =>
    apiFetch<AdminService>(`/admin/services/${id}`),

  createService: (data: Partial<AdminService>) =>
    apiFetch<{ success: boolean; id: number }>('/admin/services', { method: 'POST', body: data }),

  updateService: (id: number, data: Partial<AdminService>) =>
    apiFetch<{ success: boolean }>(`/admin/services/${id}`, { method: 'PUT', body: data }),

  deleteService: (id: number) =>
    apiFetch(`/admin/services/${id}`, { method: 'DELETE' }),

  getContactMessages: (page = 1) =>
    apiFetch<Paginated<ContactMessage>>(`/admin/contact-messages?page=${page}&perPage=20`),

  replyContact: (id: number, message: string) =>
    apiFetch(`/admin/contact-messages/${id}/reply`, { method: 'POST', body: { message } }),

  updateContactStatus: (id: number, status: string) =>
    apiFetch(`/admin/contact-messages/${id}`, { method: 'PATCH', body: { status } }),

  getPromos: (page = 1) =>
    apiFetch<Paginated<AdminPromo>>(`/admin/promos?page=${page}&perPage=20`),

  createPromo: (data: Partial<AdminPromo>) =>
    apiFetch<AdminPromo>('/admin/promos', { method: 'POST', body: data }),

  updatePromo: (id: number, data: Partial<AdminPromo>) =>
    apiFetch<AdminPromo>(`/admin/promos/${id}`, { method: 'PUT', body: data }),

  deletePromo: (id: number) =>
    apiFetch(`/admin/promos/${id}`, { method: 'DELETE' }),

  generatePromoCode: () =>
    apiFetch<{ code: string }>('/admin/promos/generate', { method: 'POST' }),
};
