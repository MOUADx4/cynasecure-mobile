import Constants from 'expo-constants';

const baseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string) ??
  'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(
  path: string,
  opts: Options = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const method = opts.method ?? 'GET';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {}),
  };

  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: opts.body
      ? opts.body instanceof FormData
        ? (opts.body as any)
        : JSON.stringify(opts.body)
      : undefined,
  });

  const ct = res.headers.get('content-type') ?? '';
  const data = ct.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && (data as any).message) ||
      `Erreur ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export async function clearSession(): Promise<void> {
  // Cookie clearing requires a native module not available in Expo Go.
  // Server-side logout via /auth/logout is sufficient.
}

export const apiBaseUrl = baseUrl;
