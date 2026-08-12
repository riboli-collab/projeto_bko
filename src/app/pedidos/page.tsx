import { listarPedidos, FILTROS_VAZIOS } from '@/consultas/lista'
import { TelaLista } from '@/telas/TelaLista'

export default async function Pedidos() {
  return <TelaLista inicial={await listarPedidos(FILTROS_VAZIOS)} />
}
