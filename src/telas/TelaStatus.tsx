'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StatusDoPedido } from '@/design/secoes/status-do-pedido/components'
import { ResumoDaCobranca } from './ResumoDaCobranca'
import { mudarSituacao } from '@/app/acoes/mudar-situacao'
import { abrirPendencia, responderPendencia } from '@/app/acoes/pendencias'
import type { DadosDoStatus } from '@/consultas/pedido'
import type { SituacaoId } from '@/dominio/tipos'

export function TelaStatus({ dados }: { dados: DadosDoStatus }) {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [gravando, iniciar] = useTransition()

  const executar = (acao: () => Promise<{ ok: boolean; motivo?: string }>) =>
    iniciar(async () => {
      const r = await acao()
      // A recusa da regra de negócio vira mensagem, não exceção: o motivo
      // escrito é o que ensina a regra.
      if (r.ok) { setErro(null); router.refresh() } else { setErro(r.motivo ?? 'Não foi possível gravar.') }
    })

  return (
    <>
      <StatusDoPedido
        pedido={dados.pedido}
        situacoes={dados.situacoes}
        historico={dados.historico}
        pendencias={dados.pendencias}
        transicoes={dados.transicoes}
        pessoas={dados.pessoas}
        isLoading={gravando}
        erro={erro}
        onMudarSituacao={(id: SituacaoId, motivo: string) =>
          executar(() => mudarSituacao(dados.pedido.numero, id, motivo))}
        onAbrirPendencia={(pergunta, dono) =>
          executar(() => abrirPendencia(dados.pedido.numero, pergunta, dono))}
        onResponderPendencia={(id, resposta, ehRegra) =>
          executar(() => responderPendencia(Number(id), resposta, ehRegra))}
        onVoltarParaLista={() => router.push('/pedidos')}
      />

      {/* A ficha mostra o preço por linha; o que o cliente paga na fatura é isto.
          Sem este bloco, `valorDoChip` era gravado no banco e nunca lido em lugar nenhum. */}
      <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6 lg:px-8">
        {/* Mesma grade do StatusDoPedido: o cartão fica na coluna dos dados do
            pedido, e não atravessado sob a coluna do histórico. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5">
          <ResumoDaCobranca cobranca={dados.cobranca} />
        </div>
      </div>
    </>
  )
}
