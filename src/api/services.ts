import { apiFetch } from './apiFetch';

export type Service = {
  id: number;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  categorySlug: string;
  priceMonthly: number;
  priceYearly?: number;
  type: 'saas' | 'one_shot';
  badge?: string;
  image?: string;
  images?: string[];
  features?: { label: string; included: boolean }[];
  technicalSpecs?: { label: string; value: string }[];
  availability?: 'available' | 'maintenance' | 'unavailable';
  trialAvailable?: boolean;
};

export type Category = {
  slug: string;
  name: string;
  description?: string;
  count: number;
  imagePath?: string;
};

type SearchCriteria = {
  q?: string;
  categories?: string[];
  priceMin?: number;
  priceMax?: number;
  onlyAvailable?: boolean;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  type?: 'all' | 'saas' | 'one_shot';
};

type SearchResult = {
  total: number;
  items: Service[];
};

export const servicesApi = {
  getAll: () => apiFetch<Service[]>('/services'),

  getById: (id: number | string) => apiFetch<Service>(`/services/${id}`),

  getSimilar: (id: number | string, limit = 6) =>
    apiFetch<Service[]>(`/services/${id}/similar?limit=${limit}`),

  search: (criteria: SearchCriteria) => {
    const qs = new URLSearchParams();
    if (criteria.q) qs.set('q', criteria.q);
    if (criteria.categories?.length) qs.set('categories', criteria.categories.join(','));
    if (criteria.priceMin != null) qs.set('priceMin', String(criteria.priceMin));
    if (criteria.priceMax != null) qs.set('priceMax', String(criteria.priceMax));
    if (criteria.onlyAvailable) qs.set('onlyAvailable', '1');
    if (criteria.sort) qs.set('sort', criteria.sort);
    if (criteria.type && criteria.type !== 'all') qs.set('type', criteria.type);
    return apiFetch<SearchResult>(`/services/search?${qs}`);
  },
};

export const categoriesApi = {
  getAll: () => apiFetch<Category[]>('/categories'),
};
