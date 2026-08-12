import { Check, Loader2, Scale, Search, UserPlus } from 'lucide-react'
import type {
  ClienteCadastro,
  DivergenciaDeCadastro,
  ResultadoDaBusca,
} from '../types'
import { Campo } from './Campos'
import { classeDoControle, FOCO, MONO } from './estilos'
import { documentoCompleto, formatarDocumento, digitos } from './formato'

interface BuscaDeClienteProps {
  valor: string
  resultado: ResultadoDaBusca
  cliente?: ClienteCadastro | null
  divergencias: DivergenciaDeCadastro[]
  erro?: string | null
  apontamento?: string | null
  apontadoPor?: string
  disabled?: boolean
  onChange?: (valor: string) => void
  onBuscar?: (cnpjCpf: string) => void
  onRegistrarDivergencia?: (divergencias: DivergenciaDeCadastro[]) => void
}

/**
 * Campo 1 e a busca na base.
 *
 * É a correção das 10.113 redigitações: fechada a contagem de dígitos, o cadastro vem
 * do CNPJ e ninguém digita razão social de novo. Quando o digitado diverge da base,
 * a tela não escolhe sozinha — mostra os dois lados e registra a divergência.
 */
export function BuscaDeCliente({
  valor,
  resultado,
  cliente = null,
  divergencias,
  erro = null,
  apontamento = null,
  apontadoPor,
  disabled = false,
  onChange,
  onBuscar,
  onRegistrarDivergencia,
}: BuscaDeClienteProps) {
  const total = digitos(valor).length
  const completo = documentoCompleto(valor)

  const alterar = (bruto: string) => {
    const formatado = formatarDocumento(bruto)
    onChange?.(formatado)
    if (documentoCompleto(formatado)) onBuscar?.(formatado)
  }

  return (
    <div className="sm:col-span-2">
      <Campo
        id="campo-cnpjCpf"
        rotulo="CNPJ / CPF"
        numero={1}
        obrigatorio
        erro={erro}
        apontamento={apontamento}
        apontadoPor={apontadoPor}
        ajuda="CNPJ tem 14 dígitos, CPF tem 11. O cadastro vem da base assim que a contagem fechar."
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            id="campo-cnpjCpf"
            type="text"
            inputMode="numeric"
            value={formatarDocumento(valor)}
            disabled={disabled}
            placeholder="00.000.000/0000-00"
            aria-invalid={Boolean(erro || apontamento)}
            onChange={(evento) => alterar(evento.target.value)}
            className={`${classeDoControle(
              apontamento ? 'apontado' : erro ? 'erro' : 'normal'
            )} pl-9 pr-24 tabular-nums`}
            style={{ fontFamily: MONO }}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${
              completo
                ? 'text-emerald-600 dark:text-emerald-400'
                : total > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 dark:text-slate-600'
            }`}
            style={{ fontFamily: MONO }}
          >
            {total} {total === 1 ? 'dígito' : 'dígitos'}
          </span>
        </div>
      </Campo>

      {/* O desfecho da busca, dito na tela */}
      {resultado === 'buscando' && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
          Procurando na base de clientes…
        </p>
      )}

      {resultado === 'encontrado' && cliente && (
        <p className="mt-2 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>
            <span className="font-medium">{cliente.razaoSocial}</span> encontrado na base. Nome,
            endereço fiscal, contato, telefone e os dois e-mails vieram do cadastro.
          </span>
        </p>
      )}

      {resultado === 'nao-encontrado' && (
        <p className="mt-2 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
          <UserPlus className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>
            Este documento não está na base. É cliente novo — preencha os campos 2 a 4 e o cadastro
            nasce com o pedido.
          </span>
        </p>
      )}

      {divergencias.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/70 dark:bg-amber-950/40">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <Scale className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            {divergencias.length === 1
              ? 'Um campo diverge do cadastro'
              : `${divergencias.length} campos divergem do cadastro`}
          </p>

          <ul className="mt-2.5 flex flex-col gap-2.5">
            {divergencias.map((divergencia) => (
              <li key={divergencia.campoId} className="grid gap-1.5 sm:grid-cols-2">
                <div className="rounded border border-amber-200/80 bg-white px-2.5 py-1.5 dark:border-amber-900/60 dark:bg-slate-950">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-500">
                    {divergencia.rotulo} — digitado
                  </p>
                  <p className="mt-0.5 break-words text-xs text-slate-500 line-through dark:text-slate-500">
                    {divergencia.valorDigitado}
                  </p>
                </div>
                <div className="rounded border border-emerald-200 bg-white px-2.5 py-1.5 dark:border-emerald-900/60 dark:bg-slate-950">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-500">
                    {divergencia.rotulo} — na base (vale)
                  </p>
                  <p className="mt-0.5 break-words text-xs text-slate-900 dark:text-slate-100">
                    {divergencia.valorDaBase}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              onClick={() => onRegistrarDivergencia?.(divergencias)}
              className={`rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 ${FOCO}`}
            >
              Registrar divergência e seguir com o da base
            </button>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Fica anexada ao pedido para a base ser corrigida depois.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
