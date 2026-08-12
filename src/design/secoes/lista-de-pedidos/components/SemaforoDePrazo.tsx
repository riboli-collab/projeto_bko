import { Pause } from 'lucide-react'
import type { EstadoDoPrazo } from '../types'
import { MONO, PRAZO } from './estilos'

interface SemaforoDePrazoProps {
  estado: EstadoDoPrazo
  dias: number
  /** `destaque` é o número maior usado no cabeçalho do grupo. */
  tamanho?: 'normal' | 'destaque'
}

/**
 * O número de dias parados, colorido pelo estado do prazo.
 * Pedido encerrado não tem relógio correndo: mostra travessão, não zero.
 */
export function SemaforoDePrazo({ estado, dias, tamanho = 'normal' }: SemaforoDePrazoProps) {
  const estilo = PRAZO[estado]

  if (estado === 'encerrado') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 tabular-nums ${estilo.capsula} ${
          tamanho === 'destaque' ? 'text-sm' : 'text-xs'
        }`}
        style={{ fontFamily: MONO }}
        title={estilo.descricao}
      >
        —<span className="sr-only">{estilo.descricao}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold tabular-nums ${estilo.capsula} ${
        tamanho === 'destaque' ? 'text-sm' : 'text-xs'
      }`}
      style={{ fontFamily: MONO }}
      title={`${dias} ${dias === 1 ? 'dia parado' : 'dias parados'} — ${estilo.descricao}`}
    >
      {estado === 'pausado' && <Pause className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} />}
      {dias}
      <span className="font-normal opacity-60">d</span>
      <span className="sr-only">
        {dias === 1 ? 'dia parado' : 'dias parados'}, {estilo.descricao}
      </span>
    </span>
  )
}
