import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FOCO, MONO } from './estilos'

interface Opcao {
  valor: string
  rotulo: string
  /** Contagem opcional exibida à direita da opção. */
  quantidade?: number
}

interface SeletorMultiploProps {
  rotulo: string
  opcoes: Opcao[]
  selecionadas: string[]
  onChange: (selecionadas: string[]) => void
}

/** Filtro de seleção múltipla. Sem dependência de biblioteca — portável para qualquer projeto. */
export function SeletorMultiplo({ rotulo, opcoes, selecionadas, onChange }: SeletorMultiploProps) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    const aoClicarFora = (evento: MouseEvent) => {
      if (!containerRef.current?.contains(evento.target as Node)) setAberto(false)
    }
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  const alternar = (valor: string) => {
    onChange(
      selecionadas.includes(valor)
        ? selecionadas.filter((item) => item !== valor)
        : [...selecionadas, valor]
    )
  }

  const ativo = selecionadas.length > 0

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={`flex w-full items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${FOCO} ${
          ativo
            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <span className="truncate">{rotulo}</span>
        {ativo && (
          <span
            className="rounded bg-blue-100 px-1 text-[11px] font-semibold tabular-nums text-blue-700 dark:bg-blue-900/70 dark:text-blue-200"
            style={{ fontFamily: MONO }}
          >
            {selecionadas.length}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {aberto && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 top-full z-40 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          {opcoes.map((opcao) => {
            const marcada = selecionadas.includes(opcao.valor)
            return (
              <button
                key={opcao.valor}
                type="button"
                role="option"
                aria-selected={marcada}
                onClick={() => alternar(opcao.valor)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    marcada
                      ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {marcada && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="truncate">{opcao.rotulo}</span>
                {typeof opcao.quantidade === 'number' && (
                  <span
                    className="ml-auto text-[11px] tabular-nums text-slate-400 dark:text-slate-500"
                    style={{ fontFamily: MONO }}
                  >
                    {opcao.quantidade}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
