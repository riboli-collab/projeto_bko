'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ListChecks, Plus } from 'lucide-react'
import { AppShell } from '@/design/shell'
import { sair } from '@/app/acoes/entrar'

export function Shell({
  contagens,
  usuario,
  children,
}: {
  contagens: { estourados: number; emAberto: number }
  /** Quem está logado, resolvido no servidor. Nunca digitado nem fixo. */
  usuario: { nome: string; papel: string }
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
      user={{ name: usuario.nome, role: usuario.papel }}
      onNavigate={(href) => router.push(href)}
      // Sair de verdade: apaga o cookie no servidor. Antes só navegava para a
      // raiz, e a sessão continuava aberta no computador que ficou sem dono.
      onLogout={() => { void sair() }}
    >
      {children}
    </AppShell>
  )
}
