'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Search, UserRoundSearch } from 'lucide-react'
import {
  CARTAO, FOCO, classeDoControle, formatarDocumento, MONO,
} from '@/design/secoes/entrada-do-pedido/components'
import { procurarClientesAction } from '@/app/acoes/buscar-cliente'
import type { ClienteDaBusca } from '@/consultas/clientes'

/** Tempo parado antes de perguntar ao banco. Menos que isto consulta a cada tecla. */
const ESPERA_MS = 250
const MINIMO = 3

/**
 * Achar o cliente pelo nome, não só pelo CNPJ.
 *
 * O campo 1 do formulário já busca por documento quando a contagem de dígitos
 * fecha — mas ninguém decora 14 dígitos, e quem vende sabe o nome. Este bloco
 * procura pelos dois e devolve o cadastro inteiro para o formulário.
 *
 * Fica aqui, e não no pacote de design, porque a cópia em `src/design/` é
 * intocada: a fonte é o projeto de design e a cópia é regerada no export.
 * Quando a Entrada for redesenhada, este bloco vira um campo lá dentro e some
 * daqui — até lá, ele é composto por fora, com os tokens do próprio design.
 */
export function LocalizarCliente({
  onEscolher, escolhido = null, ocupado = false,
}: {
  onEscolher: (cnpjCpf: string) => void
  /** A razão social já escolhida, para o bloco dizer o que aconteceu. */
  escolhido?: string | null
  ocupado?: boolean
}) {
  const idBase = useId()
  const idLista = `${idBase}-lista`
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<ClienteDaBusca[]>([])
  const [buscando, setBuscando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const campo = useRef<HTMLInputElement>(null)
  // O termo da última busca disparada. Resposta que chega fora de ordem é
  // descartada: sem isto, digitar rápido deixa a lista de "com" por cima da de "comer".
  const ultimo = useRef('')

  useEffect(() => {
    const alvo = termo.trim()
    ultimo.current = alvo

    if (alvo.replace(/\D/g, '').length < MINIMO && alvo.length < MINIMO) {
      setResultados([]); setBuscando(false); setAberto(false); setAtivo(-1)
      return
    }

    setBuscando(true)
    const relogio = setTimeout(async () => {
      const achados = await procurarClientesAction(alvo)
      if (ultimo.current !== alvo) return
      setResultados(achados)
      setBuscando(false)
      setAberto(true)
      setAtivo(-1)
    }, ESPERA_MS)

    return () => clearTimeout(relogio)
  }, [termo])

  function escolher(cliente: ClienteDaBusca) {
    onEscolher(cliente.cnpjCpf)
    setTermo('')
    setResultados([])
    setAberto(false)
    setAtivo(-1)
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto || resultados.length === 0) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setAtivo((i) => (i + 1) % resultados.length)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setAtivo((i) => (i <= 0 ? resultados.length - 1 : i - 1))
    } else if (evento.key === 'Enter' && ativo >= 0) {
      evento.preventDefault()
      escolher(resultados[ativo])
    } else if (evento.key === 'Escape') {
      evento.preventDefault()
      setAberto(false)
      setAtivo(-1)
    }
  }

  const curto = termo.trim().length > 0 && termo.trim().length < MINIMO
  const semResultado = aberto && !buscando && resultados.length === 0 && !curto

  return (
    <section aria-labelledby={`${idBase}-titulo`} className={`${CARTAO} p-4`}>
      <div className="flex items-center gap-2">
        <UserRoundSearch className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={2} aria-hidden="true" />
        <h2 id={`${idBase}-titulo`} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Localizar cliente na base
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Pelo nome ou pelo CNPJ/CPF. Escolhendo um da lista, o cadastro inteiro entra no
        formulário e ninguém redigita.
      </p>

      <div className="relative mt-3">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          strokeWidth={1.75}
        />
        <input
          ref={campo}
          id={`${idBase}-campo`}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={aberto && resultados.length > 0}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={ativo >= 0 ? `${idLista}-${ativo}` : undefined}
          aria-label="Localizar cliente por nome ou CNPJ/CPF"
          aria-describedby={`${idBase}-situacao`}
          disabled={ocupado}
          value={termo}
          placeholder="Digite o nome do cliente ou o documento"
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={aoTeclar}
          className={`${classeDoControle('normal')} pl-9 pr-9`}
        />
        {buscando && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500 dark:text-slate-400"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Quem usa leitor de tela precisa saber que a lista mudou sob os dedos. */}
      <p id={`${idBase}-situacao`} role="status" aria-live="polite" className="sr-only">
        {buscando
          ? 'Procurando…'
          : aberto && resultados.length > 0
            ? `${resultados.length} ${resultados.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}. Use as setas para escolher.`
            : semResultado
              ? 'Nenhum cliente encontrado.'
              : ''}
      </p>

      {curto && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Digite pelo menos {MINIMO} caracteres.
        </p>
      )}

      {aberto && resultados.length > 0 && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Clientes encontrados"
          className="mt-2 max-h-64 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800"
        >
          {resultados.map((cliente, i) => (
            <li key={cliente.cnpjCpf} role="none">
              <button
                type="button"
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={i === ativo}
                onClick={() => escolher(cliente)}
                onMouseEnter={() => setAtivo(i)}
                className={`flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 dark:border-slate-800/70 ${FOCO} ${
                  i === ativo ? 'bg-slate-100 dark:bg-slate-800/70' : 'bg-white dark:bg-slate-950'
                }`}
              >
                <span className="text-sm text-slate-900 dark:text-slate-100">{cliente.razaoSocial}</span>
                <span
                  className="text-xs tabular-nums text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: MONO }}
                >
                  {formatarDocumento(cliente.cnpjCpf)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {semResultado && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Nenhum cliente com esse nome ou documento. É cliente novo — preencha o formulário e o
          cadastro nasce com o pedido.
        </p>
      )}

      {escolhido && !aberto && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
          Cadastro de <span className="font-medium">{escolhido}</span> carregado no formulário.
        </p>
      )}
    </section>
  )
}
