import { apiFetch, apiBaseUrl } from './apiFetch';

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  phone?: string;
};

type CartItem = {
  serviceId: number;
  billing: 'monthly' | 'yearly';
};

type IntentResponse = {
  clientSecret: string;
  paypalOrderId: string | null;
  paypalApproveUrl: string | null;
  orderId: number;
  total: number;
};

type ConfirmResponse = {
  paymentId: number;
  invoiceNumber: string;
  total: number;
};

export const checkoutApi = {
  intent: (items: CartItem[], address: CheckoutAddress, guestEmail?: string, promoCode?: string, paypalReturnUrl?: string) =>
    apiFetch<IntentResponse>('/checkout/intent', {
      method: 'POST',
      body: { items, address, guestEmail, promoCode, paypalReturnUrl },
    }),

  confirm: (data: {
    orderId: number;
    gateway: 'stripe' | 'paypal';
    paymentIntentId?: string;
    paypalOrderId?: string;
  }) => apiFetch<ConfirmResponse>('/checkout/confirm', { method: 'POST', body: data }),

  applyPromo: (code: string, total: number) =>
    apiFetch<{ valid: boolean; discount: number; discountedTotal: number }>(
      '/cart/promo',
      { method: 'POST', body: { code, total } }
    ),

  invoiceUrl: (paymentId: number) =>
    `${apiBaseUrl}/checkout/invoice/${paymentId}`,
};
