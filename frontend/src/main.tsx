import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen';
import '@/assets/styles/taildwind.css';
import { ToastContainer } from 'react-toastify';
export const router = createRouter({ routeTree, scrollRestoration: true });

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
    <ToastContainer />
  </StrictMode>,
)
