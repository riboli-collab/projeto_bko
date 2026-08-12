import { TriangleAlert } from 'lucide-react'
import type { StatusDoPedidoProps, Situacao } from '../types'
import { BarraDeTransicao } from './BarraDeTransicao'
import { CabecalhoDoPedido } from './CabecalhoDoPedido'
import { DadosDoCliente, DadosDoPedido } from './DadosDoPedido'
import { LinhaDoTempo } from './LinhaDoTempo'
import { Pendencias } from './Pendencias'
import { ReguaDoFluxo } from './ReguaDoFluxo'
import { CARTAO } from './estilos'

const SITUACAO_DESCONHECIDA: Situacao = {
  id: 'PEDIDO_DO_COMERCIAL',
  rotulo: 'PEDIDO DO COMERCIAL',
  rotuloCurto: 'COMERCIAL',
  ordem: 1,
  prazoRotulo: '4 horas',
  prazoDiasUteis: null,
  encerra: false,
  ehExcecao: false,
  soPortabilidade: false,
}

/**
 * O Status do Pedido.
 *
 * Duas colunas no desktop: à esquerda o que o pedido é, à direita o que aconteceu com
 * ele. O histórico não fica atrás de aba nenhuma — é a prova de auditoria, e prova
 * escondida não serve.
 */
export function StatusDoPedido({
  pedido,
  situacoes,
  historico,
  pendencias,
  transicoes,
  pessoas,
  isLoading = false,
  erro = null,
  onMudarSituacao,
  onAbrirPendencia,
  onResponderPendencia,
  onVoltarParaLista,
}: StatusDoPedidoProps) {
  const situacaoAtual =
    situacoes.find((item) => item.id === pedido.situacaoId) ?? SITUACAO_DESCONHECIDA

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-5">
            <div className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
            <div className="h-72 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
          </div>
          <div className="flex flex-col gap-5">
            <div className="h-56 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
            <div className="h-80 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <CabecalhoDoPedido
        pedido={pedido}
        situacao={situacaoAtual}
        onVoltarParaLista={onVoltarParaLista}
      />

      {erro && (
        <div
          role="alert"
          className={`${CARTAO} flex items-start gap-2 border-red-200 bg-red-50/70 p-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200`}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {erro}
        </div>
      )}

      {/* Largura inteira: a régua é a resposta de relance, e responde antes de o olho
          escolher uma coluna. */}
      <ReguaDoFluxo
        situacoes={situacoes}
        situacaoAtual={situacaoAtual}
        historico={historico}
        pedido={pedido}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Esquerda: o que o pedido é. Fica presa no topo — o histórico à direita é
            sempre mais alto, e a situação atual não pode sair da vista enquanto se lê. */}
        <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <BarraDeTransicao
            transicoes={transicoes}
            situacoes={situacoes}
            situacaoAtual={situacaoAtual}
            onMudarSituacao={onMudarSituacao}
          />
          <DadosDoPedido pedido={pedido} />
          <DadosDoCliente pedido={pedido} />
        </div>

        {/* Direita: o que aconteceu com ele */}
        <div className="flex min-w-0 flex-col gap-5">
          <Pendencias
            pendencias={pendencias}
            situacoes={situacoes}
            situacaoAtual={situacaoAtual}
            pessoas={pessoas}
            onAbrirPendencia={onAbrirPendencia}
            onResponderPendencia={onResponderPendencia}
          />
          <LinhaDoTempo historico={historico} situacoes={situacoes} />
        </div>
      </div>
    </div>
  )
}
