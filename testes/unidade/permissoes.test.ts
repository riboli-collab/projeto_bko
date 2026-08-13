import { describe, it, expect } from 'vitest'
import {
  podeMudarSituacao, podeMexerEmPendencia, podeCriarPedido, aplicarPapel,
  papelDe, PAPEIS, type Papel,
} from '@/dominio/permissoes'
import { transicoesDisponiveis } from '@/dominio/maquina-de-estados'

const mover = (papel: Papel, de: Parameters<typeof podeMudarSituacao>[0]['de'],
               para: Parameters<typeof podeMudarSituacao>[0]['para']) =>
  podeMudarSituacao({ papel, de, para })

describe('o Comercial abre o pedido e para por aí', () => {
  it('não move pedido nenhum, de lugar nenhum', () => {
    const tentativas = [
      ['PEDIDO_DO_COMERCIAL', 'AGUARDANDO_CONFECCAO'],
      ['CONTRATO_ASSINADO', 'ENVIADO_PARA_OPERADORA'],
      ['ENTREGUE', 'PEDIDO_FINALIZADO'],
      ['AGUARDANDO_CONFECCAO', 'CANCELADO'],
    ] as const
    for (const [de, para] of tentativas) {
      expect(mover('Comercial', de, para).pode, `${de} -> ${para}`).toBe(false)
    }
  })

  it('mas continua criando pedido — é o trabalho dele', () => {
    expect(podeCriarPedido('Comercial').pode).toBe(true)
  })

  it('e fica fora de pendência, que é registro de trabalho do BKO', () => {
    expect(podeMexerEmPendencia('Comercial').pode).toBe(false)
  })

  it('o motivo diz o que fazer, não só que não pode', () => {
    const { motivo } = mover('Comercial', 'ENTREGUE', 'PEDIDO_FINALIZADO')
    expect(motivo).toContain('pendência')
  })
})

describe('o BKO cobre a faixa 2 a 13, e o BKO cobre o BKO', () => {
  it('move o pedido ao longo do caminho', () => {
    expect(mover('BKO', 'AGUARDANDO_CONFECCAO', 'CONTRATO_ENVIADO').pode).toBe(true)
    expect(mover('BKO', 'CONTRATO_ASSINADO', 'ENVIADO_PARA_OPERADORA').pode).toBe(true)
    expect(mover('BKO', 'PRONTO_PRA_ENTREGA', 'ENTREGUE').pode).toBe(true)
  })

  it('não confere a entrada — isso é da Liderança', () => {
    const v = mover('BKO', 'PEDIDO_DO_COMERCIAL', 'AGUARDANDO_CONFECCAO')
    expect(v.pode).toBe(false)
    expect(v.motivo).toContain('Liderança')
  })

  it('nem devolve ao Comercial, que também é decisão da conferência', () => {
    expect(mover('BKO', 'PEDIDO_DO_COMERCIAL', 'DEVOLVIDO').pode).toBe(false)
  })

  it('não finaliza — finalizar é lançar no Custos', () => {
    const v = mover('BKO', 'ENTREGUE', 'PEDIDO_FINALIZADO')
    expect(v.pode).toBe(false)
    expect(v.motivo).toContain('Custos')
  })

  it('mas para PARADO e CANCELADO vai, de qualquer ponto da faixa', () => {
    expect(mover('BKO', 'ENVIADO_PARA_OPERADORA', 'PARADO').pode).toBe(true)
    expect(mover('BKO', 'AGUARDANDO_PORTABILIDADE', 'CANCELADO').pode).toBe(true)
  })

  it('a trilha da operadora NÃO restringe: um cobre o outro', () => {
    // Decisão registrada: o PRD divide Vivo/2BX (Gabrielle) das demais (Hiago)
    // e deixa a ausência em aberto. Aqui a divisão é combinado de equipe, não
    // regra do sistema — senão a falta de uma pessoa para a esteira dela.
    expect(mover('BKO', 'ENVIADO_PARA_OPERADORA', 'CONTRATO_DA_OPERADORA').pode).toBe(true)
  })
})

describe('Liderança e Supervisão cobrem tudo', () => {
  for (const papel of ['Liderança', 'Supervisão'] as const) {
    it(`${papel} confere a entrada, anda no meio e finaliza`, () => {
      expect(mover(papel, 'PEDIDO_DO_COMERCIAL', 'AGUARDANDO_CONFECCAO').pode).toBe(true)
      expect(mover(papel, 'CONTRATO_ENVIADO', 'CONTRATO_ASSINADO').pode).toBe(true)
      expect(mover(papel, 'ENTREGUE', 'PEDIDO_FINALIZADO').pode).toBe(true)
      expect(podeMexerEmPendencia(papel).pode).toBe(true)
    })
  }
})

describe('papel desconhecido cai no mais restrito', () => {
  it('texto que não é papel vira Comercial, não acesso total', () => {
    for (const ruim of ['bko', 'BKO ', 'Financeiro', '', null, undefined, 'admin']) {
      expect(papelDe(ruim as string), String(ruim)).toBe('Comercial')
    }
  })

  it('e os quatro papéis de verdade sobrevivem à conversão', () => {
    for (const papel of PAPEIS) expect(papelDe(papel)).toBe(papel)
  })
})

describe('o papel entra por cima da máquina de estados, nunca por baixo', () => {
  const doComercial = () => transicoesDisponiveis({
    atual: 'PEDIDO_DO_COMERCIAL', tipo: 'Linha nova',
    temComprovante: false, situacaoAnterior: null,
  })

  it('não libera o que o processo fechou', () => {
    const antes = doComercial()
    const depois = aplicarPapel(antes, 'Supervisão', 'PEDIDO_DO_COMERCIAL')

    // Supervisão cobre tudo, e ainda assim nada que estava bloqueado abriu.
    for (const t of antes.filter((x) => !x.permitida)) {
      const igual = depois.find((d) => d.situacaoId === t.situacaoId)!
      expect(igual.permitida, t.situacaoId).toBe(false)
      // E a mensagem do processo é preservada: ela é mais específica que a de papel.
      expect(igual.motivoDoBloqueio).toBe(t.motivoDoBloqueio)
    }
  })

  it('fecha para o BKO o que o processo tinha aberto', () => {
    const antes = doComercial()
    const depois = aplicarPapel(antes, 'BKO', 'PEDIDO_DO_COMERCIAL')

    const abertasAntes = antes.filter((t) => t.permitida)
    expect(abertasAntes.length).toBeGreaterThan(0)
    expect(depois.filter((t) => t.permitida)).toHaveLength(0)
    for (const t of depois) expect(t.motivoDoBloqueio).toBeTruthy()
  })

  it('deixa a Liderança com exatamente o que o processo permitia', () => {
    const antes = doComercial()
    const depois = aplicarPapel(antes, 'Liderança', 'PEDIDO_DO_COMERCIAL')
    expect(depois).toEqual(antes)
  })
})
