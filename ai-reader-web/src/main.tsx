import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { router } from "./router";
import { useUserStore } from "./store/user";
// import { reportPerformance } from './utils/performance';
import "@/styles/index.css";

// 启动性能监控
// reportPerformance();

// 启动时尝试从 token 恢复登录态
useUserStore.getState().hydrateFromToken();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>
);
