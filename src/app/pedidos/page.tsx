import { listarPedidos, FILTROS_VAZIOS } from '@/consultas/lista'
import { TelaLista } from '@/telas/TelaLista'

/**
 * Renderizada a cada requisição, nunca pré-gerada.
 *
 * Sem isto o `next build` consulta o banco e assa o HTML: a Esteira em produção
 * mostraria a fila do momento em que o deploy foi feito, e o build passaria a
 * exigir DATABASE_URL — falhando onde o banco ainda não existe.
 */
export const dynamic = 'force-dynamic'

export default async function Pedidos() {
  return <TelaLista inicial={await listarPedidos(FILTROS_VAZIOS)} />
}
