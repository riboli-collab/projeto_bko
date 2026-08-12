import { useEffect, useRef, useState } from 'react'
import { ChevronUp, LogOut } from 'lucide-react'

export interface ShellUser {
  name: string
  /** Exibido como tag: "Liderança", "BKO", "Comercial". */
  role?: string
  avatarUrl?: string
}

interface UserMenuProps {
  user: ShellUser
  collapsed?: boolean
  /** `bar` posiciona o menu abaixo do avatar — usado na barra superior do mobile. */
  placement?: 'sidebar' | 'bar'
  onLogout?: () => void
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu({
  user,
  collapsed = false,
  placement = 'sidebar',
  onLogout,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const avatar = (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(user.name)
      )}
    </span>
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? user.name : undefined}
        className={[
          'flex w-full items-center rounded-md text-sm transition-colors',
          'hover:bg-slate-100 dark:hover:bg-slate-800/70',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
          collapsed || placement === 'bar' ? 'justify-center p-1' : 'gap-2.5 px-2 py-2',
        ].join(' ')}
      >
        {avatar}

        {!collapsed && placement === 'sidebar' && (
          <>
            <span className="flex min-w-0 flex-col items-start">
              <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                {user.name}
              </span>
              {user.role && (
                <span className="mt-0.5 rounded px-1 py-px text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60">
                  {user.role}
                </span>
              )}
            </span>
            <ChevronUp
              className={[
                'ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform',
                open ? '' : 'rotate-180',
              ].join(' ')}
              strokeWidth={1.75}
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={[
            'absolute z-50 min-w-52 rounded-md border border-slate-200 bg-white p-1 shadow-lg',
            'dark:border-slate-800 dark:bg-slate-900',
            placement === 'bar' ? 'right-0 top-full mt-2' : 'bottom-full left-0 mb-2 w-full',
          ].join(' ')}
        >
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.name}
            </p>
            {user.role && (
              <p className="mt-0.5 text-xs text-indigo-600 dark:text-indigo-400">{user.role}</p>
            )}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
