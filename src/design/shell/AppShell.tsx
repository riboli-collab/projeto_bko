import { useEffect, useState, type ReactNode } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { MainNav, type NavigationItem } from './MainNav'
import { UserMenu, type ShellUser } from './UserMenu'

export interface AppShellProps {
  children: ReactNode
  navigationItems?: NavigationItem[]
  user?: ShellUser
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-[13px] font-bold text-white"
    >
      E
    </span>
  )
}

export function AppShell({
  children,
  navigationItems = [],
  user,
  onNavigate,
  onLogout,
}: AppShellProps) {
  // Desktop expandida, tablet colapsada. Depois disso, quem manda é o botão.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  // O drawer fecha no Esc.
  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const hasAlert = navigationItems.some(
    (item) => item.badgeTone === 'alert' && (item.badge ?? 0) > 0
  )

  const handleNavigate = (href: string) => {
    setMobileOpen(false)
    onNavigate?.(href)
  }

  const sidebarBody = (isCollapsed: boolean) => (
    <>
      <div
        className={[
          'flex h-14 shrink-0 items-center border-b border-slate-200 dark:border-slate-800',
          isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-4',
        ].join(' ')}
      >
        <BrandMark />
        {!isCollapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Esteira
          </span>
        )}
      </div>

      <MainNav items={navigationItems} collapsed={isCollapsed} onNavigate={handleNavigate} />

      {user && (
        <div className="shrink-0 border-t border-slate-200 p-2 dark:border-slate-800">
          <UserMenu user={user} collapsed={isCollapsed} onLogout={onLogout} />
        </div>
      )}
    </>
  )

  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* Sidebar — desktop e tablet */}
      <aside
        className={[
          'relative hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex',
          'dark:border-slate-800 dark:bg-slate-950',
          collapsed ? 'w-16' : 'w-64',
        ].join(' ')}
      >
        {sidebarBody(collapsed)}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="absolute -right-3 top-[18px] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-slate-200 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </button>
      </aside>

      {/* Drawer — mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-2 top-3.5 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
            {sidebarBody(false)}
          </aside>
        </div>
      )}

      {/* Área de conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior — só no mobile */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
            {/* O alarme é a única coisa do shell que não some em nenhuma largura */}
            {hasAlert && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:bg-red-400 dark:ring-slate-950">
                <span className="sr-only">Há pedidos com prazo estourado</span>
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Esteira
            </span>
          </div>

          {user && (
            <div className="ml-auto">
              <UserMenu user={user} placement="bar" onLogout={onLogout} />
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export default AppShell
