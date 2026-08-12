import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SITUACOES, situacao, caminhoNormal, formaDeEntregaExibida } from '@/dominio/situacoes'

describe('catálogo de situações', () => {
  it('tem 17 status: 14 no caminho normal e 3 exceções', () => {
    expect(SITUACOES).toHaveLength(17)
    expect(SITUACOES.filter((s) => !s.ehExcecao)).toHaveLength(14)
    expect(SITUACOES.filter((s) => s.ehExcecao).map((s) => s.id)).toEqual([
      'DEVOLVIDO', 'PARADO', 'CANCELADO',
    ])
  })

  it('numera o caminho normal de 1 a 14, sem buraco', () => {
    const ordens = SITUACOES.filter((s) => !s.ehExcecao).map((s) => s.ordem)
    expect(ordens).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
  })

  it('deixa a ordem nula nas três exceções', () => {
    for (const s of SITUACOES.filter((x) => x.ehExcecao)) expect(s.ordem).toBeNull()
  })

  it('guarda os prazos validados pela supervisão em 11/08/2026', () => {
    expect(situacao('PEDIDO_DO_COMERCIAL').prazoRotulo).toBe('4 horas')
    expect(situacao('AGUARDANDO_CONFECCAO').prazoDiasUteis).toBe(1)
    expect(situacao('CONTRATO_ENVIADO').prazoDiasUteis).toBe(2)
    expect(situacao('CONTRATO_ASSINADO').prazoRotulo).toBe('mesmo dia')
    expect(situacao('ENVIADO_PARA_OPERADORA').prazoDiasUteis).toBe(2)
    expect(situacao('CONTRATO_ASSINADO_INPUT').prazoDiasUteis).toBe(3)
    expect(situacao('FATURADO_NA_OPERADORA').prazoDiasUteis).toBe(3)
  })

  it('traduz "4 horas" para meio dia útil, não um dia', () => {
    // Com 1, o alerta de um prazo de 4 horas só dispararia dois dias depois.
    expect(situacao('PEDIDO_DO_COMERCIAL').prazoDiasUteis).toBe(0.5)
  })

  it('traduz "mesmo dia" para 1, não 0', () => {
    // Com 0, o pedido entraria em `atencao` no instante em que chega no status.
    expect(situacao('CONTRATO_ASSINADO').prazoDiasUteis).toBe(1)
    expect(situacao('ENVIO_SMS').prazoDiasUteis).toBe(1)
  })

  it('diz nas exceções por que não há relógio, em vez de um travessão mudo', () => {
    expect(situacao('DEVOLVIDO').prazoRotulo).toBe('relógio parado')
    expect(situacao('PARADO').prazoRotulo).toBe('decisão do Comercial')
  })

  it('não dá prazo em dias a AGUARDANDO_PORTABILIDADE — o prazo é a data agendada', () => {
    expect(situacao('AGUARDANDO_PORTABILIDADE').prazoDiasUteis).toBeNull()
  })

  it('marca como encerrantes só PEDIDO_FINALIZADO e CANCELADO', () => {
    expect(SITUACOES.filter((s) => s.encerra).map((s) => s.id)).toEqual([
      'PEDIDO_FINALIZADO', 'CANCELADO',
    ])
  })

  it('tira ENVIO_SMS e AGUARDANDO_PORTABILIDADE do caminho de quem não é portabilidade', () => {
    const linhaNova = caminhoNormal('Linha nova').map((s) => s.id)
    expect(linhaNova).toHaveLength(12)
    expect(linhaNova).not.toContain('ENVIO_SMS')
    expect(caminhoNormal('Portabilidade')).toHaveLength(14)
  })

  it('mantém o rótulo curto abaixo de 20 caracteres, para caber em chip e coluna', () => {
    for (const s of SITUACOES) expect(s.rotuloCurto.length).toBeLessThanOrEqual(20)
  })

  it('exibe eSIM como forma de entrega mesmo sendo tipo de chip (D2)', () => {
    expect(formaDeEntregaExibida({ tipoDeChip: 'eSIM', formaDeEntrega: null })).toBe('eSIM')
    expect(formaDeEntregaExibida({ tipoDeChip: 'Físico', formaDeEntrega: 'Motoboy' })).toBe('Motoboy')
  })
})

/**
 * A GUARDA CONTRA DERIVA.
 *
 * O catálogo acima é transcrição do pacote de design. Transcrição envelhece:
 * basta alguém ajustar um rótulo no Design OS e as duas verdades se separam em
 * silêncio — a tela mostrando um texto, o agrupamento da Lista usando outro.
 *
 * Este teste compara os dois arquivos campo a campo. Ele lê o pacote de design
 * direto do disco, e é o único ponto do sistema que faz isso: em produção a
 * Esteira não depende do Design OS, mas na bancada de teste depende, de
 * propósito.
 */
describe('o catálogo não pode divergir do pacote de design', () => {
  const origem = path.resolve(
    import.meta.dirname,
    '../../../esteira-design/product-plan/sections/lista-de-pedidos/sample-data.json',
  )

  it('encontra o pacote de design no lugar esperado', () => {
    expect(fs.existsSync(origem), `pacote de design não está em ${origem}`).toBe(true)
  })

  it('bate com o sample-data em id, rótulo, ordem e prazo — os 17', () => {
    const doDesign = JSON.parse(fs.readFileSync(origem, 'utf8')).situacoes as Record<string, unknown>[]
    expect(doDesign).toHaveLength(SITUACOES.length)

    for (const esperada of doDesign) {
      const nossa = situacao(esperada.id as never)
      // `quantidade` é do sample-data, não do catálogo: é resultado de consulta.
      expect({
        id: nossa.id, rotulo: nossa.rotulo, rotuloCurto: nossa.rotuloCurto,
        ordem: nossa.ordem, prazoRotulo: nossa.prazoRotulo,
        prazoDiasUteis: nossa.prazoDiasUteis, encerra: nossa.encerra,
        ehExcecao: nossa.ehExcecao, soPortabilidade: nossa.soPortabilidade,
      }, `divergência em ${esperada.id}`).toEqual({
        id: esperada.id, rotulo: esperada.rotulo, rotuloCurto: esperada.rotuloCurto,
        ordem: esperada.ordem, prazoRotulo: esperada.prazoRotulo,
        prazoDiasUteis: esperada.prazoDiasUteis, encerra: esperada.encerra,
        ehExcecao: esperada.ehExcecao, soPortabilidade: esperada.soPortabilidade,
      })
    }
  })
})
