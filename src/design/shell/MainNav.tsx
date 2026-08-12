import type { ComponentType } from 'react'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
  /** Contagem exibida como badge. Zero ou ausente = nenhum badge. */
  badge?: number
  /** `alert` pinta o badge de vermelho. Reservado para prazo estourado. */
  badgeTone?: 'alert' | 'neutral'
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
}

interface MainNavProps {
  items: NavigationItem[]
  collapsed?: boolean
  onNavigate?: (href: string) => void
}

/**
 * A sigla de quem não trouxe ícone.
 *
 * Uma letra só resolveria, não fosse "Painel" e "Pedidos" começarem igual — e na
 * sidebar colapsada, onde o rótulo some, dois "P" idênticos deixam o menu ilegível.
 * Cresce até desempatar.
 */
function siglasDe(items: NavigationItem[]): string[] {
  const siglas = items.map((item) => item.label.trim().slice(0, 1).toUpperCase())

  for (let tamanho = 2; tamanho <= 3; tamanho++) {
    const repetidas = new Set(siglas.filter((s, i) => siglas.indexOf(s) !== i))
    if (repetidas.size === 0) break
    items.forEach((item, i) => {
      if (repetidas.has(siglas[i])) {
        const bruta = item.label.trim().slice(0, tamanho)
        siglas[i] = bruta.charAt(0).toUpperCase() + bruta.slice(1).toLowerCase()
      }
    })
  }

  return siglas
}

export function MainNav({ items, collapsed = false, onNavigate }: MainNavProps) {
  const siglas = siglasDe(items)

  return (
    <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-2 py-3">
      <ul className="flex flex-col gap-1">
        {items.map((item, indice) => {
          const Icon = item.icon
          const isAlert = item.badgeTone === 'alert'
          const hasBadge = typeof item.badge === 'number' && item.badge > 0

          return (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => onNavigate?.(item.href)}
                aria-current={item.isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={[
                  'group relative flex w-full items-center rounded-md text-sm transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                  'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                  item.isActive
                    ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
                ].join(' ')}
              >
                {/* Marcador do item ativo */}
                <span
                  aria-hidden="true"
                  className={[
                    'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-blue-600 dark:bg-blue-400',
                    item.isActive ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />

                <span className="relative shrink-0">
                  {Icon ? (
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  ) : (
                    // Sem ícone, a inicial do rótulo. O quadrado vazio que estava
                    // aqui virava uma caixa de seleção falsa — e, na sidebar
                    // colapsada, três caixas idênticas e indistinguíveis.
                    <span
                      aria-hidden="true"
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-sm bg-current/10 text-[10px] font-semibold leading-none"
                    >
                      {siglas[indice]}
                    </span>
                  )}

                  {/* Colapsada: o número vira ponto, mas o alarme sobrevive */}
                  {collapsed && hasBadge && (
                    <span
                      className={[
                        'absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-950',
                        isAlert ? 'bg-red-600 dark:bg-red-400' : 'bg-slate-400 dark:bg-slate-500',
                      ].join(' ')}
                    >
                      <span className="sr-only">
                        {item.badge} {isAlert ? 'com prazo estourado' : 'em aberto'}
                      </span>
                    </span>
                  )}
                </span>

                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>

                    {hasBadge && (
                      <span
                        className={[
                          'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] leading-none tabular-nums',
                          isAlert
                            ? 'bg-red-100 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-slate-100 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                        ].join(' ')}
                        style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                      >
                        {item.badge}
                        <span className="sr-only">
                          {isAlert ? ' com prazo estourado' : ' em aberto'}
                        </span>
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
