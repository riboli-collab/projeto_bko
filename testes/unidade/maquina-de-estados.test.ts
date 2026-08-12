import { describe, it, expect } from 'vitest'
import { transicoesDisponiveis, validarTransicao } from '@/dominio/maquina-de-estados'
import type { SituacaoId } from '@/dominio/tipos'

const t = (
  atual: SituacaoId,
  tipo: 'Portabilidade' | 'Linha nova' = 'Portabilidade',
  temComprovante = false,
  situacaoAnterior: SituacaoId | null = null,
) => transicoesDisponiveis({ atual, tipo, temComprovante, situacaoAnterior })

const achar = (lista: ReturnType<typeof t>, id: SituacaoId) => lista.find((x) => x.situacaoId === id)!

describe('transicoesDisponiveis', () => {
  it('devolve as 17 situações, para a tela desenhar até as bloqueadas', () => {
    expect(t('FATURADO_NA_OPERADORA')).toHaveLength(17)
  })

  it('marca exatamente uma como próxima do fluxo', () => {
    const proximas = t('FATURADO_NA_OPERADORA').filter((x) => x.ehProximaDoFluxo)
    expect(proximas).toHaveLength(1)
    expect(proximas[0].situacaoId).toBe('ENVIO_SMS')
  })

  it('em pedido que não é portabilidade, pula direto para PRONTO_PRA_ENTREGA', () => {
    const proximas = t('FATURADO_NA_OPERADORA', 'Linha nova').filter((x) => x.ehProximaDoFluxo)
    expect(proximas[0].situacaoId).toBe('PRONTO_PRA_ENTREGA')
  })

  it('bloqueia pular etapa, com o motivo escrito', () => {
    const salto = achar(t('CONTRATO_ENVIADO'), 'ENVIADO_PARA_OPERADORA')
    expect(salto.permitida).toBe(false)
    expect(salto.motivoDoBloqueio).toMatch(/assinad/i)
  })

  it('bloqueia voltar atrás', () => {
    const volta = achar(t('CONTRATO_ASSINADO'), 'CONTRATO_ENVIADO')
    expect(volta.permitida).toBe(false)
    expect(volta.motivoDoBloqueio).toMatch(/não volta|nada volta/i)
  })

  it('bloqueia a própria situação atual', () => {
    expect(achar(t('CONTRATO_ASSINADO'), 'CONTRATO_ASSINADO').permitida).toBe(false)
  })

  it('só permite DEVOLVIDO a partir de PEDIDO_DO_COMERCIAL', () => {
    expect(achar(t('PEDIDO_DO_COMERCIAL'), 'DEVOLVIDO').permitida).toBe(true)
    const bloqueada = achar(t('CONTRATO_ASSINADO'), 'DEVOLVIDO')
    expect(bloqueada.permitida).toBe(false)
    expect(bloqueada.motivoDoBloqueio).toMatch(/PEDIDO DO COMERCIAL/)
  })

  it('permite PARADO e CANCELADO de qualquer situação, sempre exigindo motivo', () => {
    for (const origem of ['PEDIDO_DO_COMERCIAL', 'FATURADO_NA_OPERADORA', 'ENTREGUE'] as SituacaoId[]) {
      for (const destino of ['PARADO', 'CANCELADO'] as SituacaoId[]) {
        const x = achar(t(origem), destino)
        expect(x.permitida).toBe(true)
        expect(x.exigeMotivo).toBe(true)
      }
    }
  })

  it('não exige motivo no caminho normal', () => {
    expect(achar(t('FATURADO_NA_OPERADORA'), 'ENVIO_SMS').exigeMotivo).toBe(false)
  })

  it('só finaliza a partir de ENTREGUE e com comprovante', () => {
    expect(achar(t('ENTREGUE', 'Portabilidade', false), 'PEDIDO_FINALIZADO').motivoDoBloqueio)
      .toMatch(/comprovante/i)
    expect(achar(t('ENTREGUE', 'Portabilidade', true), 'PEDIDO_FINALIZADO').permitida).toBe(true)
  })

  it('não oferece saída de pedido encerrado', () => {
    expect(t('PEDIDO_FINALIZADO').every((x) => !x.permitida)).toBe(true)
    expect(t('CANCELADO').every((x) => !x.permitida)).toBe(true)
  })

  it('deixa o pedido DEVOLVIDO voltar para PEDIDO_DO_COMERCIAL', () => {
    expect(achar(t('DEVOLVIDO'), 'PEDIDO_DO_COMERCIAL').permitida).toBe(true)
  })

  it('deixa PARADO voltar para a situação de onde travou — não é beco sem saída', () => {
    const lista = t('PARADO', 'Portabilidade', false, 'ENVIADO_PARA_OPERADORA')
    expect(achar(lista, 'ENVIADO_PARA_OPERADORA').permitida).toBe(true)
    // E só para lá: não se aproveita a parada para pular etapa.
    expect(achar(lista, 'CONTRATO_DA_OPERADORA').permitida).toBe(false)
  })

  it('em PARADO sem situação anterior conhecida, diz o que fazer em vez de travar mudo', () => {
    const lista = t('PARADO')
    const retomada = lista.filter((x) => x.permitida && x.situacaoId !== 'CANCELADO')
    expect(retomada).toHaveLength(0)
    expect(achar(lista, 'ENVIADO_PARA_OPERADORA').motivoDoBloqueio)
      .toMatch(/histórico/i)
  })
})

describe('validarTransicao', () => {
  const base = {
    tipo: 'Portabilidade' as const, temComprovante: false, situacaoAnterior: null,
  }

  it('recusa transição bloqueada', () => {
    const r = validarTransicao({
      ...base, atual: 'CONTRATO_ENVIADO', destino: 'ENVIADO_PARA_OPERADORA', motivo: '',
    })
    expect(r.ok).toBe(false)
  })

  it('recusa transição de problema sem motivo', () => {
    const r = validarTransicao({ ...base, atual: 'ENTREGUE', destino: 'PARADO', motivo: '   ' })
    expect(r).toEqual({ ok: false, motivo: 'Transição de problema exige motivo escrito.' })
  })

  it('aceita transição de problema com motivo', () => {
    const r = validarTransicao({
      ...base, atual: 'ENTREGUE', destino: 'PARADO',
      motivo: 'Operadora não respondeu em 5 dias.',
    })
    expect(r.ok).toBe(true)
  })

  it('aceita o caminho normal sem motivo', () => {
    const r = validarTransicao({
      ...base, atual: 'FATURADO_NA_OPERADORA', destino: 'ENVIO_SMS', motivo: '',
    })
    expect(r.ok).toBe(true)
  })
})
