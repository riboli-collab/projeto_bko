import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Shell } from '@/telas/Shell'
import { contarParaOShell } from '@/consultas/painel'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--fonte-corpo' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--fonte-mono' })

export const metadata: Metadata = { title: 'Esteira — BKO' }

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
