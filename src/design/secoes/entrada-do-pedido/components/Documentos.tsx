import { useRef } from 'react'
import { Check, CornerDownRight, FileText, Paperclip, X } from 'lucide-react'
import type {
  ArquivoAnexado,
  Documento,
  DocumentoId,
} from '../types'
import { FOCO, MICRO_ROTULO, MONO } from './estilos'
import { formatarTamanho } from './formato'

interface DocumentosProps {
  /** Só os documentos do tipo de pessoa digitado no primeiro campo. */
  documentos: Documento[]
  anexos: ArquivoAnexado[]
  /** Motivos escritos pelo BKO, por documento, no modo devolução. */
  apontamentos?: Partial<Record<DocumentoId, string>>
  apontadoPor?: string
  /** Some quando o CNPJ/CPF ainda não fechou a contagem de dígitos. */
  aguardandoDocumento?: boolean
  onAnexar?: (documentoId: DocumentoId, arquivo: File) => void
  onRemoverAnexo?: (documentoId: DocumentoId) => void
}

/**
 * Os documentos que o pedido precisa trazer anexados.
 *
 * A lista muda com o tipo de pessoa: CNPJ pede contrato social e documento do
 * representante legal; CPF pede documento pessoal, comprovante de residência e
 * fatura ou evidência de titularidade. A fatura do CNPJ é a única opcional — ela
 * só é pedida quando existe.
 */
export function Documentos({
  documentos,
  anexos,
  apontamentos = {},
  apontadoPor,
  aguardandoDocumento = false,
  onAnexar,
  onRemoverAnexo,
}: DocumentosProps) {
  const anexoDe = (id: DocumentoId) => anexos.find((item) => item.documentoId === id) ?? null

  if (aguardandoDocumento) {
    return (
      <p className="text-xs text-slate-400 sm:col-span-2 dark:text-slate-500">
        Os documentos exigidos aparecem aqui assim que o CNPJ/CPF for informado — a lista muda
        conforme seja empresa ou pessoa física.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2 sm:col-span-2">
      {documentos.map((documento) => (
        <LinhaDeDocumento
          key={documento.id}
          documento={documento}
          anexo={anexoDe(documento.id)}
          apontamento={apontamentos[documento.id] ?? null}
          apontadoPor={apontadoPor}
          onAnexar={onAnexar}
          onRemover={onRemoverAnexo}
        />
      ))}
    </ul>
  )
}

interface LinhaDeDocumentoProps {
  documento: Documento
  anexo: ArquivoAnexado | null
  apontamento: string | null
  apontadoPor?: string
  onAnexar?: (documentoId: DocumentoId, arquivo: File) => void
  onRemover?: (documentoId: DocumentoId) => void
}

function LinhaDeDocumento({
  documento,
  anexo,
  apontamento,
  apontadoPor,
  onAnexar,
  onRemover,
}: LinhaDeDocumentoProps) {
  const entrada = useRef<HTMLInputElement>(null)

  const faltando = documento.obrigatorio && !anexo
  const problema = Boolean(apontamento)

  return (
    <li
      className={`rounded-md border p-3 transition-colors ${
        problema
          ? 'border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30'
          : anexo
            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/70 dark:bg-emerald-950/20'
            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {documento.rotulo}
              {documento.obrigatorio && (
                <span aria-hidden="true" className="ml-1 text-blue-600 dark:text-blue-400">
                  *
                </span>
              )}
            </span>
            {!documento.obrigatorio && <span className={MICRO_ROTULO}>opcional</span>}
            {anexo && !problema && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
                anexado
              </span>
            )}
          </p>

          {anexo ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="min-w-0 break-all text-slate-700 dark:text-slate-300">
                {anexo.nome}
              </span>
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {formatarTamanho(anexo.tamanho)}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{documento.ajuda}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={entrada}
            type="file"
            className="hidden"
            aria-label={`Anexar ${documento.rotulo}`}
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0]
              if (arquivo) onAnexar?.(documento.id, arquivo)
              evento.target.value = ''
            }}
          />

          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${FOCO} ${
              faltando || problema
                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <Paperclip className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {anexo ? 'Trocar' : 'Anexar'}
          </button>

          {anexo && (
            <button
              type="button"
              onClick={() => onRemover?.(documento.id)}
              aria-label={`Remover ${documento.rotulo}`}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${FOCO}`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

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
    </li>
  )
}
