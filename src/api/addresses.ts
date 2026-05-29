import { apiFetch } from './apiFetch';

export type Address = {
  id: number;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

export type AddressPayload = {
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
};

export const addressesApi = {
  list: () => apiFetch<Address[]>('/me/addresses'),
  create: (data: AddressPayload) => apiFetch<Address>('/me/addresses', { method: 'POST', body: data }),
  update: (id: number, data: Partial<AddressPayload>) =>
    apiFetch<Address>(`/me/addresses/${id}`, { method: 'PATCH', body: data }),
  remove: (id: number) => apiFetch(`/me/addresses/${id}`, { method: 'DELETE' }),
  setDefault: (id: number) => apiFetch<Address>(`/me/addresses/${id}/default`, { method: 'POST' }),
};
