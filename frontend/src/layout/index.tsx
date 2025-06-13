import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./sidebar"
import { ToastContainer } from 'react-toastify';
import { FC, ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "./error-boundary";
import { Outlet } from "@tanstack/react-router";


export const RootLayout: FC = () => {
  return (
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-hidden"> 
            {/* <ErrorBoundary fallbackRender={FallbackRender}> */}
            {/* <Suspense
              fallback={
                <div className=" w-full h-full flex justify-center items-center">
                  <span>Loading...</span>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary> */}
          <Outlet />
          </main>
        </SidebarProvider >
     
  )
}
