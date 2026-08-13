import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Shell } from '@/telas/Shell'
import { headers } from 'next/headers'
import { contarParaOShell } from '@/consultas/painel'
import { semNavegacao } from '@/dominio/sessao'
import { usuarioAtual } from '@/app/acoes/sessao'

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
  // A entrada e a troca de senha não são parte do app: não levam navegação, e
  // a entrada não pode consultar o banco — quem ainda não entrou não deve
  // provocar consulta nenhuma. E oferecer navegação a quem ainda precisa
  // trocar a senha seria oferecer o que o proxy vai recusar em seguida.
  const caminho = (await headers()).get('x-caminho') ?? ''
  const semShell = semNavegacao(caminho)

  const [contagens, usuario] = semShell
    ? [null, null]
    : await Promise.all([contarParaOShell(), usuarioAtual()])

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${mono.variable} bg-white dark:bg-slate-950`}>
        {contagens && usuario
          ? <Shell contagens={contagens} usuario={usuario}>{children}</Shell>
          : children}
      </body>
    </html>
  )
}
