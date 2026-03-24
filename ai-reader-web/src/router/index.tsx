import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import ErrorBoundary from "../components/ErrorBoundary";
import Trending from "../pages/Trending";
import Favorite from "../pages/Favorite";
import Subscription from "../pages/Subscription";
import Login from "../pages/User/Login";
import Register from "../pages/User/Register";
import User from "../pages/User/User";
import Article from "../pages/article";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorBoundary />,
    children: [
      
    ],
  },
  {
    path: "/article/:id",
    element: <Article />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/trending",
    element: <Trending />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/subscription",
    element: <Subscription></Subscription>,
  },
  {
    path: "/favorite",
    element: <Favorite></Favorite>,
  },
  {
    path: "/user-info",
    element: <User></User>,
  },
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path: "/register",
    element: <Register></Register>,
  },
]);
