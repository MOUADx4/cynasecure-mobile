import { apiFetch } from './apiFetch';
import type { Category, Service } from './services';

export type HomeContentBlock = {
  slug: string;
  title?: string;
  content: string;
};

export type CarouselSlide = {
  id: number;
  title: string;
  subtitle: string | null;
  imagePath: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  position: number;
  isActive: boolean;
};

export type HomeContent = {
  slug: string;
  title: string | null;
  content: string;
};

export type HomeCategory = {
  id: number;
  name: string;
  slug: string;
  imagePath: string | null;
  homePosition: number | null;
};

export type HomeService = {
  id: number;
  name: string;
  description: string | null;
  priceMonthly: number | null;
  category: string | null;
  homePosition: number | null;
};

export const adminHomeApi = {
  // Carousel
  listSlides: () =>
    apiFetch<CarouselSlide[]>('/admin/home/carousel'),
  createSlide: (data: Partial<CarouselSlide>) =>
    apiFetch<CarouselSlide>('/admin/home/carousel', { method: 'POST', body: data }),
  updateSlide: (id: number, data: Partial<CarouselSlide>) =>
    apiFetch<CarouselSlide>(`/admin/home/carousel/${id}`, { method: 'PATCH', body: data }),
  deleteSlide: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/home/carousel/${id}`, { method: 'DELETE' }),
  reorderSlides: (ids: number[]) =>
    apiFetch<{ ok: boolean }>('/admin/home/carousel/reorder', { method: 'PATCH', body: ids }),

  // Content
  getContent: (slug: string) =>
    apiFetch<HomeContent>(`/admin/home/content/${slug}`),
  saveContent: (slug: string, data: { title?: string; content: string }) =>
    apiFetch<HomeContent>(`/admin/home/content/${slug}`, { method: 'PUT', body: data }),

  // Categories
  listCategories: () =>
    apiFetch<HomeCategory[]>('/admin/home/categories'),
  updateCategoryHome: (id: number, data: { homePosition?: number | null }) =>
    apiFetch<HomeCategory>(`/admin/home/categories/${id}/home`, { method: 'PATCH', body: data }),
  reorderCategories: (ids: number[]) =>
    apiFetch<{ ok: boolean }>('/admin/home/categories/reorder', { method: 'PATCH', body: ids }),

  // Top products
  listTopProducts: () =>
    apiFetch<HomeService[]>('/admin/home/top-products'),
  addTopProduct: (serviceId: number) =>
    apiFetch<HomeService>(`/admin/home/top-products/${serviceId}`, { method: 'POST' }),
  removeTopProduct: (serviceId: number) =>
    apiFetch<{ ok: boolean }>(`/admin/home/top-products/${serviceId}`, { method: 'DELETE' }),
  reorderTopProducts: (ids: number[]) =>
    apiFetch<{ ok: boolean }>('/admin/home/top-products/reorder', { method: 'PATCH', body: ids }),
};

export const homeApi = {
  getCarousel: () => apiFetch<CarouselSlide[]>('/home/carousel'),
  getContent: (slug: string) => apiFetch<HomeContentBlock>(`/home/content/${slug}`),
  getCategories: () => apiFetch<Category[]>('/home/categories'),
  getTopProducts: () => apiFetch<Service[]>('/home/top-products'),
};
