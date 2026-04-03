import apiClient from "./api-client";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  nickname?: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
}

export interface BackendArticle {
  id: string;
  title: string;
  author: string;
  hot: number;
  url: string;
  mobileUrl?: string;
  source: string;
  tag: string;
}

export interface SubscribeResponse {
  articles: BackendArticle[];
  message?: string;
}

export const loginApi = (payload: LoginPayload) =>
  apiClient.post<unknown, LoginResponse>("/auth/login", payload);

export const registerApi = (payload: RegisterPayload) =>
  apiClient.post<unknown, LoginResponse>("/auth/register", payload);

export const getHotArticlesApi = (params?: { platform?: string; tag?: string }) =>
  apiClient.get<unknown, BackendArticle[]>("/articles/hot", { params });

export const getSubscribeArticlesApi = (keyword: string) =>
  apiClient.post<unknown, SubscribeResponse>("/articles/subscribe", { keyword });

export interface TechColumn {
  id: string;
  name: string;
  keyword: string;
  description: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  subscribedKeywords: string[];
  collectedArticleIds: string[];
  collectedArticles: BackendArticle[];
  subscribedColumnIds: string[];
  subscribedColumns: TechColumn[];
}

export const getUserProfileApi = () =>
  apiClient.get<unknown, UserProfile>("/user/profile");

export const updateKeywordsApi = (keywords: string[]) =>
  apiClient.put<unknown, { subscribedKeywords: string[] }>("/user/keywords", { keywords });

export const collectArticleApi = (articleId: string) =>
  apiClient.post<unknown, { collectedArticleIds: string[] }>(`/user/collect/${articleId}`);

export const uncollectArticleApi = (articleId: string) =>
  apiClient.delete<unknown, { collectedArticleIds: string[] }>(`/user/collect/${articleId}`);

export const searchColumnsApi = (q: string) =>
  apiClient.get<unknown, TechColumn[]>('/columns/search', { params: { q } });

export const getColumnArticlesApi = (columnId: string) =>
  apiClient.get<unknown, BackendArticle[]>(`/columns/${columnId}/articles`);

export const subscribeColumnApi = (columnId: string) =>
  apiClient.post<unknown, { subscribedColumnIds: string[] }>(`/user/subscribe-column/${columnId}`);

export const unsubscribeColumnApi = (columnId: string) =>
  apiClient.delete<unknown, { subscribedColumnIds: string[] }>(`/user/subscribe-column/${columnId}`);

export const getArticleContentApi = (articleId: string) =>
  apiClient.get<unknown, { html: string; success: boolean }>(`/articles/${articleId}/content`);

export const getArticleByIdApi = (articleId: string) =>
  apiClient.get<unknown, BackendArticle>(`/articles/${articleId}`);