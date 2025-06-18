import type React from 'react'

import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Link, useLocation } from '@tanstack/react-router'
import authStore from '@/stores/authStore'
import { UserDropdown } from '@/components/common/user-dropdown'

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const { isAuthenticated } = authStore()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) return null

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <Button asChild size="default">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
