import { notFound } from 'next/navigation'
import { carregarPedido } from '@/consultas/pedido'
import { TelaStatus } from '@/telas/TelaStatus'

export default async function Pedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const dados = await carregarPedido(numero)
  if (!dados) notFound()
  return <TelaStatus dados={dados} />
}
