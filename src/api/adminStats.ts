import { apiFetch } from './apiFetch';

export type SalesPoint = {
  label: string;
  total: number;
  ordersCount: number;
};

export type SalesByCategoryPoint = {
  label: string;
  categories: Record<string, number>;
};

export type CategoryDistributionItem = {
  category: string;
  total: number;
  percentage: number;
};

export type ChartData = {
  period: 'days' | 'weeks';
  salesOverTime: SalesPoint[];
  salesByCategory: SalesByCategoryPoint[];
  categoryDistribution: CategoryDistributionItem[];
};

export const adminStatsApi = {
  getCharts: (period: 'days' | 'weeks') =>
    apiFetch<ChartData>(`/admin/stats/charts?period=${period}`),
};
