export default async function Pedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  return <h1>Status do pedido {numero}</h1>
}
