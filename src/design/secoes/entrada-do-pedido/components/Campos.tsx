import type { ReactNode } from 'react'
import { AlertCircle, ChevronDown, CornerDownRight, Database } from 'lucide-react'
import { classeDoControle, FOCO, MICRO_ROTULO, MONO } from './estilos'
import type { EstadoDoCampo } from './estilos'

interface CampoProps {
  id: string
  rotulo: string
  /** O número do campo na SOP, de 1 a 11. Ausente nos campos que não são obrigatórios. */
  numero?: number
  obrigatorio?: boolean
  ajuda?: string
  /** Validação devolvida no envio. */
  erro?: string | null
  /** O motivo escrito pelo BKO ao devolver o pedido. */
  apontamento?: string | null
  /** Quem escreveu o apontamento. */
  apontadoPor?: string
  /** Marca o campo como vindo do cadastro, sem redigitação. */
  daBase?: boolean
  className?: string
  children: ReactNode
}

/**
 * O invólucro de um campo do formulário.
 *
 * A anotação do BKO fica presa ao campo, e não numa lista à parte: o Comercial lê o
 * motivo no mesmo lugar onde vai digitar a correção.
 */
export function Campo({
  id,
  rotulo,
  numero,
  obrigatorio = false,
  ajuda,
  erro = null,
  apontamento = null,
  apontadoPor,
  daBase = false,
  className = '',
  children,
}: CampoProps) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {rotulo}
          {obrigatorio && (
            <span aria-hidden="true" className="ml-1 text-blue-600 dark:text-blue-400">
              *
            </span>
          )}
        </label>

        {numero != null && (
          <span className={MICRO_ROTULO} style={{ fontFamily: MONO }}>
            campo {numero}
          </span>
        )}

        {daBase && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Database className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
            da base
          </span>
        )}
      </div>

      {children}

      {ajuda && !erro && !apontamento && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{ajuda}</p>
      )}

      {erro && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          {erro}
        </p>
      )}

      {apontamento && (
        <div className="mt-2 flex items-start gap-2 rounded-md border-l-2 border-red-500 bg-red-50/70 py-2 pl-2.5 pr-3 dark:border-red-500 dark:bg-red-950/40">
          <CornerDownRight
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400"
            strokeWidth={2}
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-red-800 dark:text-red-200">
            {apontadoPor && (
              <span className="font-semibold text-red-900 dark:text-red-100">{apontadoPor}: </span>
            )}
            {apontamento}
          </p>
        </div>
      )}
    </div>
  )
}

interface CampoTextoProps extends Omit<CampoProps, 'children'> {
  valor: string
  onChange?: (valor: string) => void
  placeholder?: string
  estado?: EstadoDoCampo
  mono?: boolean
  disabled?: boolean
  inputMode?: 'text' | 'numeric' | 'email'
  maxLength?: number
}

export function CampoTexto({
  valor,
  onChange,
  placeholder,
  estado,
  mono = false,
  disabled = false,
  inputMode = 'text',
  maxLength,
  ...campo
}: CampoTextoProps) {
  const derivado: EstadoDoCampo =
    estado ?? (campo.apontamento ? 'apontado' : campo.erro ? 'erro' : campo.daBase ? 'daBase' : 'normal')

  return (
    <Campo {...campo}>
      <input
        id={campo.id}
        type="text"
        value={valor}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(campo.erro || campo.apontamento)}
        onChange={(evento) => onChange?.(evento.target.value)}
        className={`${classeDoControle(derivado)} ${mono ? 'tabular-nums' : ''}`}
        style={mono ? { fontFamily: MONO } : undefined}
      />
    </Campo>
  )
}

interface CampoNumeroProps extends Omit<CampoProps, 'children'> {
  valor: number | null
  onChange?: (valor: number | null) => void
  placeholder?: string
  estado?: EstadoDoCampo
  disabled?: boolean
  /** Prefixo fixo à esquerda, como "R$". */
  prefixo?: string
  /** Sufixo fixo à direita, como "linhas" ou "por linha, por mês". */
  sufixo?: string
  passo?: number
}

export function CampoNumero({
  valor,
  onChange,
  placeholder,
  estado,
  disabled = false,
  prefixo,
  sufixo,
  passo = 1,
  ...campo
}: CampoNumeroProps) {
  const derivado: EstadoDoCampo =
    estado ?? (campo.apontamento ? 'apontado' : campo.erro ? 'erro' : 'normal')

  return (
    <Campo {...campo}>
      <div className="relative">
        {prefixo && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500"
            style={{ fontFamily: MONO }}
          >
            {prefixo}
          </span>
        )}
        <input
          id={campo.id}
          type="number"
          inputMode="decimal"
          step={passo}
          min={0}
          disabled={disabled}
          value={valor ?? ''}
          placeholder={placeholder}
          aria-invalid={Boolean(campo.erro || campo.apontamento)}
          onChange={(evento) =>
            onChange?.(evento.target.value === '' ? null : Number(evento.target.value))
          }
          className={`${classeDoControle(derivado)} tabular-nums ${prefixo ? 'pl-10' : ''} ${
            sufixo ? 'pr-32' : ''
          }`}
          style={{ fontFamily: MONO }}
        />
        {sufixo && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500"
          >
            {sufixo}
          </span>
        )}
      </div>
    </Campo>
  )
}

interface OpcaoDeSelecao {
  valor: string
  rotulo: string
}

interface CampoSelecaoProps extends Omit<CampoProps, 'children'> {
  valor: string | null
  opcoes: OpcaoDeSelecao[]
  onChange?: (valor: string | null) => void
  placeholder?: string
  estado?: EstadoDoCampo
  disabled?: boolean
}

export function CampoSelecao({
  valor,
  opcoes,
  onChange,
  placeholder = 'Selecione',
  estado,
  disabled = false,
  ...campo
}: CampoSelecaoProps) {
  const derivado: EstadoDoCampo =
    estado ?? (campo.apontamento ? 'apontado' : campo.erro ? 'erro' : 'normal')

  return (
    <Campo {...campo}>
      <div className="relative">
        <select
          id={campo.id}
          value={valor ?? ''}
          disabled={disabled}
          aria-invalid={Boolean(campo.erro || campo.apontamento)}
          onChange={(evento) => onChange?.(evento.target.value === '' ? null : evento.target.value)}
          className={`${classeDoControle(derivado)} appearance-none pr-9 ${
            valor ? '' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <option value="">{placeholder}</option>
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor} className="text-slate-900">
              {opcao.rotulo}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.75}
        />
      </div>
    </Campo>
  )
}

interface GrupoDeEscolhaProps extends Omit<CampoProps, 'children'> {
  valor: string | null
  opcoes: OpcaoDeSelecao[]
  onChange?: (valor: string) => void
}

/** Lista curta e fechada — empresa faturadora, tipo de ação, forma de entrega. */
export function GrupoDeEscolha({ valor, opcoes, onChange, ...campo }: GrupoDeEscolhaProps) {
  const invalido = Boolean(campo.erro || campo.apontamento)

  return (
    <Campo {...campo}>
      <div
        role="radiogroup"
        aria-label={campo.rotulo}
        id={campo.id}
        className={`flex flex-wrap gap-1.5 ${
          invalido
            ? 'rounded-md border border-red-300 bg-red-50/60 p-1.5 dark:border-red-900 dark:bg-red-950/30'
            : ''
        }`}
      >
        {opcoes.map((opcao) => {
          const ativo = valor === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onChange?.(opcao.valor)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${FOCO} ${
                ativo
                  ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100'
              }`}
            >
              {opcao.rotulo}
            </button>
          )
        })}
      </div>
    </Campo>
  )
}
