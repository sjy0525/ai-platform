import { create } from "zustand";
import { getUserProfileApi } from "../services";

export interface UserInfo {
  id: string;
  username?: string;
  nickname: string;
  avatar?: string;
  email?: string;
  subscribedKeywords: string[];
  collectedArticleIds: string[];
  subscribedColumnIds: string[];
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  setUserInfo: (userInfo: UserInfo) => void;
  hydrateFromToken: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: false,
  userInfo: null,
  login: (userInfo) => set({ isLoggedIn: true, userInfo }),
  logout: () => {
    localStorage.removeItem("token");
    set({ isLoggedIn: false, userInfo: null });
  },
  setUserInfo: (userInfo) => set({ isLoggedIn: true, userInfo }),
  hydrateFromToken: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const profile = await getUserProfileApi();
      set({
        isLoggedIn: true,
        userInfo: {
          id: profile.id,
          username: profile.username,
          nickname: profile.nickname,
          avatar: profile.avatar,
          subscribedKeywords: profile.subscribedKeywords || [],
          collectedArticleIds: profile.collectedArticleIds || [],
          subscribedColumnIds: profile.subscribedColumnIds || [],
        },
      });
    } catch {
      localStorage.removeItem("token");
      set({ isLoggedIn: false, userInfo: null });
    }
  },
}));
