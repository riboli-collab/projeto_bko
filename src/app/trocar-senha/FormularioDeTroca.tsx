'use client'

import { useActionState, useState } from 'react'
import { trocarSenha } from '@/app/acoes/trocar-senha'
import { validarNovaSenha, MINIMO } from '@/dominio/regra-da-senha'

const CONTROLE =
  'mt-1.5 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 text-slate-900 dark:text-slate-100'

const NORMAL = 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
const COM_ERRO = 'border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30'

function Campo({ id, rotulo, valor, onChange, invalido, descrito, autoFocus = false }: {
  id: string
  rotulo: string
  valor: string
  onChange: (v: string) => void
  invalido: boolean
  descrito?: string
  autoFocus?: boolean
}) {
  return (
    <>
      <label htmlFor={id} className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={id === 'atual' ? 'current-password' : 'new-password'}
        autoFocus={autoFocus}
        required
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalido}
        aria-describedby={descrito}
        className={`${CONTROLE} ${invalido ? COM_ERRO : NORMAL}`}
      />
    </>
  )
}

/**
 * A troca de senha, obrigatória na estreia e voluntária depois.
 *
 * `obrigatoria` só muda o texto e tira a saída: quem ainda usa a senha de
 * estreia não tem para onde voltar, porque nenhuma outra tela abre. O que
 * impede de sair daqui é o proxy, não este componente — a tela apenas conta o
 * que está acontecendo, em vez de deixar a pessoa adivinhar por que foi parar
 * aqui.
 */
export function FormularioDeTroca({ nome, obrigatoria }: { nome: string; obrigatoria: boolean }) {
  const [estado, acao, enviando] = useActionState(trocarSenha, null as { erro?: string } | null)
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [atual, setAtual] = useState('')

  // A mesma função do servidor, para a pessoa ler o problema enquanto digita —
  // e não depois de enviar. O servidor continua sendo a autoridade.
  const aviso = nova === '' ? null : validarNovaSenha(nova, confirmacao || nova)
  const erro = estado?.erro ?? null

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-slate-950">
      <form action={acao} className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {obrigatoria ? 'Crie a sua senha' : 'Trocar a senha'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {obrigatoria
            ? `${nome}, você entrou com a senha que foi definida para a estreia. Escolha uma que só você saiba — é ela que vai assinar o que você fizer.`
            : `${nome}, escolha uma senha nova.`}
        </p>

        <Campo
          id="atual"
          rotulo={obrigatoria ? 'Senha de estreia' : 'Senha atual'}
          valor={atual}
          onChange={setAtual}
          invalido={Boolean(erro)}
          descrito={erro ? 'troca-erro' : undefined}
          autoFocus
        />

        <Campo
          id="nova"
          rotulo="Senha nova"
          valor={nova}
          onChange={setNova}
          invalido={Boolean(aviso) || Boolean(erro)}
          descrito={aviso ? 'troca-aviso' : erro ? 'troca-erro' : 'troca-regra'}
        />
        <p id="troca-regra" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Pelo menos {MINIMO} caracteres, com letras. Nada de sequência de números.
        </p>

        <Campo
          id="confirmacao"
          rotulo="Repita a senha nova"
          valor={confirmacao}
          onChange={setConfirmacao}
          invalido={Boolean(aviso) || Boolean(erro)}
          descrito={aviso ? 'troca-aviso' : erro ? 'troca-erro' : undefined}
        />

        {aviso && !erro && (
          <p id="troca-aviso" className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            {aviso}
          </p>
        )}

        {erro && (
          <p id="troca-erro" role="alert" className="mt-2 text-xs text-red-700 dark:text-red-400">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || Boolean(aviso) || atual === '' || confirmacao === ''}
          className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400 dark:focus-visible:ring-offset-slate-950"
        >
          {enviando ? 'Salvando…' : 'Salvar a senha nova'}
        </button>

        {obrigatoria ? (
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            Nenhuma outra tela abre até isto ser feito. É o que faz a senha de estreia ser de
            estreia: quem a definiu não a conhece depois daqui.
          </p>
        ) : (
          <a
            href="/painel"
            className="mt-6 block text-xs text-blue-700 underline underline-offset-2 dark:text-blue-400"
          >
            Voltar ao painel sem trocar
          </a>
        )}
      </form>
    </main>
  )
}
