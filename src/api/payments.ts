import { apiFetch } from './apiFetch';

export type Payment = {
  id: number;
  amount: number;
  cycle?: string;
  status: string;
  gateway?: string;
  last4?: string;
  paidAt?: string;
  invoiceNumber?: string;
};

export const paymentsApi = {
  myPayments: () => apiFetch<Payment[]>('/payments/my'),
};
