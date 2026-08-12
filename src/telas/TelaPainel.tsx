'use client'

import { useRouter } from 'next/navigation'
import { PainelDaManha } from '@/design/secoes/painel-da-manha/components'
import type { DadosDoPainel } from '@/consultas/painel'

export function TelaPainel({ dados }: { dados: DadosDoPainel }) {
  const router = useRouter()
  return (
    <PainelDaManha
      perguntas={dados.perguntas}
      resumo={dados.resumo}
      // Só duas saídas, e nenhuma delas muda situação de pedido. Se aparecer
      // um botão de "finalizar" aqui, o histórico deixa de ser completo.
      onAbrirPedido={(numero) => router.push(`/pedidos/${numero}`)}
      onVerTodos={(perguntaId) => router.push(`/pedidos?pergunta=${perguntaId}`)}
    />
  )
}
