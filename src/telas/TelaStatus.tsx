'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StatusDoPedido } from '@/design/secoes/status-do-pedido/components'
import { mudarSituacao } from '@/app/acoes/mudar-situacao'
import { abrirPendencia, responderPendencia } from '@/app/acoes/pendencias'
import type { DadosDoStatus } from '@/consultas/pedido'
import type { SituacaoId } from '@/dominio/tipos'

/** Enquanto não há login, o autor é fixo e declarado. Ver R3 do PRD. */
const QUEM = 'Raquel'

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
        executar(() => mudarSituacao(dados.pedido.numero, id, motivo, QUEM))}
      onAbrirPendencia={(pergunta, dono) =>
        executar(() => abrirPendencia(dados.pedido.numero, pergunta, dono, QUEM))}
      onResponderPendencia={(id, resposta, ehRegra) =>
        executar(() => responderPendencia(Number(id), resposta, ehRegra, QUEM))}
      onVoltarParaLista={() => router.push('/pedidos')}
    />
  )
}
