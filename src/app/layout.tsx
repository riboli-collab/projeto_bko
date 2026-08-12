import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Shell } from '@/telas/Shell'
import { contarParaOShell } from '@/consultas/painel'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--fonte-corpo' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--fonte-mono' })

export const metadata: Metadata = { title: 'Esteira — BKO' }

/**
 * O layout consulta o banco para o contador de prazo estourado da barra lateral,
 * então **nada** sob ele pode ser pré-gerado — nem a raiz, que só redireciona.
 * Declarado aqui, e não em cada página, porque a dependência é do layout.
 */
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const contagens = await contarParaOShell()
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${mono.variable} bg-white dark:bg-slate-950`}>
        <Shell contagens={contagens}>{children}</Shell>
      </body>
    </html>
  )
}
