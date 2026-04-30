import { createBrowserRouter, Outlet } from "react-router-dom";
import Home from "../pages/Home";
import ErrorBoundary from "../components/ErrorBoundary";
import Trending from "../pages/Trending";
import Favorite from "../pages/Favorite";
import Subscription from "../pages/Subscription";
import Login from "../pages/User/Login";
import Register from "../pages/User/Register";
import User from "../pages/User/User";
import Article from "../pages/article";
import SearchResult from "../pages/SearchResult";
import AnalyticsTracker from "../components/AnalyticsTracker";

const AppShell = () => (
  <>
    <AnalyticsTracker />
    <Outlet />
  </>
);

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/article/:id",
        element: <Article />,
      },
      {
        path: "/trending",
        element: <Trending />,
      },
      {
        path: "/search",
        element: <SearchResult />,
      },
      {
        path: "/subscription",
        element: <Subscription />,
      },
      {
        path: "/favorite",
        element: <Favorite />,
      },
      {
        path: "/user-info",
        element: <User />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
]);
