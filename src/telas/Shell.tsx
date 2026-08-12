'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ListChecks, Plus } from 'lucide-react'
import { AppShell } from '@/design/shell'

export function Shell({
  contagens,
  children,
}: {
  contagens: { estourados: number; emAberto: number }
  children: React.ReactNode
}) {
  const rota = usePathname()
  const router = useRouter()

  return (
    <AppShell
      navigationItems={[
        {
          label: 'Painel', href: '/painel', icon: LayoutDashboard,
          isActive: rota === '/painel',
          badge: contagens.estourados, badgeTone: 'alert',
        },
        {
          label: 'Pedidos', href: '/pedidos', icon: ListChecks,
          // O Status do Pedido é rota de detalhe: mantém "Pedidos" ativo.
          isActive: rota.startsWith('/pedidos') && rota !== '/pedidos/novo',
          badge: contagens.emAberto, badgeTone: 'neutral',
        },
        { label: 'Novo pedido', href: '/pedidos/novo', icon: Plus, isActive: rota === '/pedidos/novo' },
      ]}
      user={{ name: 'Raquel', role: 'Liderança' }}
      onNavigate={(href) => router.push(href)}
      onLogout={() => router.push('/')}
    >
      {children}
    </AppShell>
  )
}
