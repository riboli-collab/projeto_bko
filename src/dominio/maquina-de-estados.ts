import type { SituacaoId, TipoDePedido } from './tipos'
import { SITUACOES, situacao, caminhoNormal } from './situacoes'

export interface TransicaoDisponivel {
  situacaoId: SituacaoId
  permitida: boolean
  motivoDoBloqueio: string | null
  ehProximaDoFluxo: boolean
  exigeMotivo: boolean
}

const EXIGEM_MOTIVO: SituacaoId[] = ['DEVOLVIDO', 'PARADO', 'CANCELADO']

function proximaDoFluxo(atual: SituacaoId, tipo: TipoDePedido): SituacaoId | null {
  const caminho = caminhoNormal(tipo)
  const i = caminho.findIndex((s) => s.id === atual)
  if (i === -1 || i === caminho.length - 1) return null
  return caminho[i + 1].id
}

export interface Contexto {
  atual: SituacaoId
  tipo: TipoDePedido
  temComprovante: boolean
  /** De onde o pedido veio. Só importa em PARADO, para ele poder retomar. */
  situacaoAnterior: SituacaoId | null
}

export function transicoesDisponiveis(a: Contexto): TransicaoDisponivel[] {
  const atualS = situacao(a.atual)
  const proxima = proximaDoFluxo(a.atual, a.tipo)

  return SITUACOES.map((destino): TransicaoDisponivel => {
    const base = {
      situacaoId: destino.id,
      ehProximaDoFluxo: destino.id === proxima,
      exigeMotivo: EXIGEM_MOTIVO.includes(destino.id),
    }
    const bloqueio = (motivo: string) => ({ ...base, permitida: false, motivoDoBloqueio: motivo })
    const liberado = () => ({ ...base, permitida: true, motivoDoBloqueio: null })

    if (atualS.encerra) {
      return bloqueio(`O pedido está em ${atualS.rotulo}. A tela fica só de leitura.`)
    }
    if (destino.id === a.atual) {
      return bloqueio('O pedido está aqui agora.')
    }
    if (destino.id === 'PARADO' || destino.id === 'CANCELADO') {
      return liberado()
    }
    if (destino.id === 'DEVOLVIDO') {
      return a.atual === 'PEDIDO_DO_COMERCIAL'
        ? liberado()
        : bloqueio('Devolução só acontece em PEDIDO DO COMERCIAL, antes de o pedido andar.')
    }
    // De DEVOLVIDO o pedido volta ao começo da conferência, e só para lá.
    if (a.atual === 'DEVOLVIDO') {
      return destino.id === 'PEDIDO_DO_COMERCIAL'
        ? liberado()
        : bloqueio('De DEVOLVIDO o pedido volta para PEDIDO DO COMERCIAL, e a conferência recomeça.')
    }
    // De PARADO o pedido retoma exatamente de onde travou. Sem isso, PARADO
    // seria beco sem saída: o pedido entra e nunca mais anda.
    if (a.atual === 'PARADO') {
      if (a.situacaoAnterior === null) {
        return bloqueio('Não dá para retomar: o histórico não diz de qual situação este pedido parou.')
      }
      return destino.id === a.situacaoAnterior
        ? liberado()
        : bloqueio(`De PARADO o pedido retoma em ${situacao(a.situacaoAnterior).rotulo}, de onde travou.`)
    }
    if (destino.ehExcecao) {
      return bloqueio('Situação de exceção, alcançada por decisão e não pelo fluxo.')
    }

    const caminho = caminhoNormal(a.tipo)
    const iAtual = caminho.findIndex((s) => s.id === a.atual)
    const iDestino = caminho.findIndex((s) => s.id === destino.id)

    if (iDestino === -1) {
      return bloqueio(`${destino.rotulo} só existe em pedido de portabilidade.`)
    }
    if (iDestino < iAtual) {
      return bloqueio('Nada volta atrás — o histórico registra o caminho, e ele é só para a frente.')
    }
    if (iDestino > iAtual + 1) {
      const pulados = caminho.slice(iAtual + 1, iDestino).map((s) => s.rotulo).join(' e ')
      return bloqueio(`Passa por ${pulados} antes.`)
    }
    if (destino.id === 'PEDIDO_FINALIZADO' && !a.temComprovante) {
      return bloqueio('Só depois de ENTREGUE, com o comprovante anexado.')
    }
    return liberado()
  })
}

export function validarTransicao(
  a: Contexto & { destino: SituacaoId; motivo: string },
): { ok: true } | { ok: false; motivo: string } {
  const oferta = transicoesDisponiveis(a).find((x) => x.situacaoId === a.destino)
  if (!oferta || !oferta.permitida) {
    return { ok: false, motivo: oferta?.motivoDoBloqueio ?? 'Transição desconhecida.' }
  }
  if (oferta.exigeMotivo && a.motivo.trim() === '') {
    return { ok: false, motivo: 'Transição de problema exige motivo escrito.' }
  }
  return { ok: true }
}
