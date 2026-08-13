'use client'

import { useActionState } from 'react'
import { entrar } from '@/app/acoes/entrar'

const CONTROLE =
  'mt-1.5 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 text-slate-900 dark:text-slate-100'

const NORMAL = 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
const COM_ERRO = 'border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30'

/**
 * A tela de entrada.
 *
 * Não veio do pacote de design — não existe seção desenhada para ela. Usa só os
 * tokens do sistema, sem inventar componente novo.
 *
 * O erro é um só para usuário inexistente, senha errada e conta desativada, e
 * fica preso ao campo de senha por `aria-describedby`. Mensagens diferentes
 * transformariam a tela num verificador de quem trabalha aqui.
 */
export function FormularioDeEntrada({ de }: { de: string }) {
  const [estado, acao, enviando] = useActionState(entrar, null as { erro?: string } | null)
  const erro = Boolean(estado?.erro)

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-slate-950">
      <form action={acao} className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Esteira
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Acompanhamento dos pedidos do BKO.
        </p>

        <input type="hidden" name="de" value={de} />

        <label
          htmlFor="usuario"
          className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Usuário
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          aria-invalid={erro}
          aria-describedby={erro ? 'entrada-erro' : undefined}
          className={`${CONTROLE} ${erro ? COM_ERRO : NORMAL}`}
        />

        <label
          htmlFor="senha"
          className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={erro}
          aria-describedby={erro ? 'entrada-erro' : undefined}
          className={`${CONTROLE} ${erro ? COM_ERRO : NORMAL}`}
        />

        {erro && (
          <p id="entrada-erro" role="alert" className="mt-1.5 text-xs text-red-700 dark:text-red-400">
            {estado?.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400 dark:focus-visible:ring-offset-slate-950"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Cada pessoa tem o seu. O que você fizer fica assinado com o seu nome no
          histórico do pedido.
        </p>
      </form>
    </main>
  )
}
