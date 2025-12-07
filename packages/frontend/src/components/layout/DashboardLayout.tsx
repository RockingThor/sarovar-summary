import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Building2, LogOut, User, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
}

export default function DashboardLayout({ 
  children, 
  title, 
  description,
  actions 
}: DashboardLayoutProps) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  const navItems = isAdmin
    ? [
        { href: '/admin', label: 'Hotels', icon: Home },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
      ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              <span className="text-lg font-display font-semibold hidden sm:inline-block">
                Sarovar Progress
              </span>
            </Link>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium hidden sm:inline-block">{user?.name}</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                {user?.role}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline-block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="border-b bg-muted/30">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}

