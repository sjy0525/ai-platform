import { createBrowserRouter, RouteObject } from 'react-router-dom'
import App from '../app.tsx'
import Home from '../pages/Home.tsx'
import About from '../pages/About.tsx'
import NotFound from '../pages/NotFound.tsx'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'about',
        element: <About />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]

export const router = createBrowserRouter(routes)
