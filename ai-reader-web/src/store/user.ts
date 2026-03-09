import { create } from "zustand";

export interface UserInfo {
  id: string;
  nickname: string;
  avatar?: string;
  email?: string;
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: false,
  userInfo: null,
  login: (userInfo) => set({ isLoggedIn: true, userInfo }),
  logout: () => set({ isLoggedIn: false, userInfo: null }),
}));
