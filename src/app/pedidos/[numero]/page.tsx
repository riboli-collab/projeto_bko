import { notFound, redirect } from 'next/navigation'
import { carregarPedido } from '@/consultas/pedido'
import { usuarioAtual } from '@/app/acoes/sessao'
import { papelDe } from '@/dominio/permissoes'
import { TelaStatus } from '@/telas/TelaStatus'

/** Renderizada a cada requisição: a situação do pedido muda o tempo todo. */
export const dynamic = 'force-dynamic'

export default async function Pedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params

  // Quem está olhando decide quais transições aparecem destravadas. O proxy já
  // garantiu que há sessão; isto é para saber o papel.
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/entrar')

  // `papelDe` cai no mais restrito quando não reconhece: um valor digitado
  // errado na CLI não pode virar acesso por acidente.
  const dados = await carregarPedido(numero, papelDe(usuario.papel))
  if (!dados) notFound()
  return <TelaStatus dados={dados} />
}
