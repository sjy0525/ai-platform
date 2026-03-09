import apiClient from "./api-client";

export interface LoginPayload {
  username: string;
  password: string;
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

export const getHotArticlesApi = (params?: { platform?: string; tag?: string }) =>
  apiClient.get<unknown, BackendArticle[]>("/articles/hot", { params });

export const getSubscribeArticlesApi = (keyword: string) =>
  apiClient.post<unknown, SubscribeResponse>("/articles/subscribe", { keyword });