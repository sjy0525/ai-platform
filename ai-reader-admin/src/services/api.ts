import type {
  AdminArticleItem,
  AdminColumnItem,
  AdminLoginResponse,
  AdminUserItem,
  AnalyticsEventItem,
  OverviewData,
  UserAnalyticsData,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

function getAdminToken() {
  return localStorage.getItem('admin_token') || '';
}

async function request<T>(
  path: string,
  init?: RequestInit,
  requireAuth = true,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  if (requireAuth) {
    const token = getAdminToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { message?: string | string[]; error?: string };
        if (Array.isArray(parsed.message)) {
          message = parsed.message.join('，');
        } else if (typeof parsed.message === 'string' && parsed.message.trim()) {
          message = parsed.message;
        } else if (typeof parsed.error === 'string' && parsed.error.trim()) {
          message = parsed.error;
        }
      } catch {
        // Keep the raw text when the backend does not return JSON.
      }
    }

    throw new Error(message || `请求失败 (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const adminApi = {
  login(username: string, password: string) {
    return request<AdminLoginResponse>(
      '/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false,
    );
  },
  getOverview() {
    return request<OverviewData>('/admin/overview');
  },
  getUsers() {
    return request<AdminUserItem[]>('/admin/users');
  },
  getUserAnalytics() {
    return request<UserAnalyticsData>('/admin/user-analytics');
  },
  getArticles(params?: { q?: string; tag?: string; source?: string }) {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.tag) search.set('tag', params.tag);
    if (params?.source) search.set('source', params.source);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request<AdminArticleItem[]>(`/admin/articles${suffix}`);
  },
  syncHotArticles() {
    return request<{ success: boolean; message: string }>('/admin/articles/hot-sync', {
      method: 'POST',
    });
  },
  getColumns() {
    return request<AdminColumnItem[]>('/admin/columns');
  },
  createColumn(payload: { name: string; keyword: string; description?: string }) {
    return request<AdminColumnItem>('/admin/columns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateColumn(
    id: string,
    payload: { name: string; keyword: string; description?: string },
  ) {
    return request<AdminColumnItem>(`/admin/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteColumn(id: string) {
    return request<{ success: boolean }>(`/admin/columns/${id}`, {
      method: 'DELETE',
    });
  },
  captureEvent(payload: {
    event: string;
    distinctId?: string;
    source?: string;
    properties?: Record<string, unknown>;
  }) {
    return request<AnalyticsEventItem>('/admin/analytics/capture', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getEvents(limit = 50) {
    return request<AnalyticsEventItem[]>(`/admin/analytics/events?limit=${limit}`);
  },
};
