import { notFound } from 'next/navigation'
import { carregarPedido } from '@/consultas/pedido'
import { TelaStatus } from '@/telas/TelaStatus'

/** Renderizada a cada requisição: a situação do pedido muda o tempo todo. */
export const dynamic = 'force-dynamic'

export default async function Pedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const dados = await carregarPedido(numero)
  if (!dados) notFound()
  return <TelaStatus dados={dados} />
}
