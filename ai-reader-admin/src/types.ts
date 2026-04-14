export interface AdminLoginResponse {
  access_token: string;
  admin: {
    username: string;
    role: string;
  };
}

export interface AdminUserItem {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  subscribedKeywords: string[];
  collectedArticleCount: number;
  subscribedColumnCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticleItem {
  id: string;
  title: string;
  author: string;
  hot: number;
  url: string;
  source: string;
  tag: string;
  createdAt: string;
}

export interface AdminColumnItem {
  id: string;
  name: string;
  keyword: string;
  description: string;
  createdAt: string;
}

export interface AnalyticsEventItem {
  id: string;
  event: string;
  distinctId: string;
  source: string;
  properties?: Record<string, unknown> | null;
  createdAt: string;
}

export interface OverviewData {
  summary: {
    userCount: number;
    articleCount: number;
    columnCount: number;
    eventCount: number;
    totalCollections: number;
    totalColumnSubscriptions: number;
  };
  tagDistribution: Array<{ name: string; value: number }>;
  sourceDistribution: Array<{ name: string; value: number }>;
  recentUsers: AdminUserItem[];
  recentArticles: AdminArticleItem[];
  recentEvents: AnalyticsEventItem[];
}

export type AdminTab = 'overview' | 'users' | 'articles' | 'columns' | 'events';
