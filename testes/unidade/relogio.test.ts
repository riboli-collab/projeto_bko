import { describe, it, expect } from 'vitest'
import { diasUteisEntre, estadoDoPrazo } from '@/dominio/relogio'
import {
  domingoDePascoa, feriadosNacionais, pontosFacultativosNacionais, ehFeriado,
} from '@/dominio/feriados'

const d = (iso: string) => new Date(`${iso}T09:00:00-03:00`)

describe('diasUteisEntre', () => {
  it('conta zero no mesmo dia', () => {
    expect(diasUteisEntre(d('2026-08-12'), d('2026-08-12'))).toBe(0)
  })

  it('conta 1 de quarta para quinta', () => {
    expect(diasUteisEntre(d('2026-08-12'), d('2026-08-13'))).toBe(1)
  })

  it('pula o fim de semana: de sexta para segunda é 1, não 3', () => {
    expect(diasUteisEntre(d('2026-08-14'), d('2026-08-17'))).toBe(1)
  })

  it('conta uma semana cheia como 5', () => {
    expect(diasUteisEntre(d('2026-08-10'), d('2026-08-17'))).toBe(5)
  })

  it('não conta negativo quando o fim é antes do início', () => {
    expect(diasUteisEntre(d('2026-08-17'), d('2026-08-10'))).toBe(0)
  })

  it('conta a segunda quando a situação mudou no sábado', () => {
    // 15/08/2026 é sábado, 17/08 é segunda. O domingo não conta; a segunda sim.
    expect(diasUteisEntre(d('2026-08-15'), d('2026-08-17'))).toBe(1)
  })

  it('não conta a Sexta-feira Santa', () => {
    // 03/04/2026 é sexta-feira santa. De quinta a segunda sobra só a segunda.
    expect(diasUteisEntre(d('2026-04-02'), d('2026-04-06'))).toBe(1)
  })

  it('não conta o Natal', () => {
    // 25/12/2026 cai numa sexta.
    expect(diasUteisEntre(d('2026-12-24'), d('2026-12-28'))).toBe(1)
  })

  it('não conta a Independência', () => {
    // 07/09/2026 cai numa segunda.
    expect(diasUteisEntre(d('2026-09-04'), d('2026-09-08'))).toBe(1)
  })

  it('dá zero quando o único dia do intervalo é feriado', () => {
    expect(diasUteisEntre(d('2026-04-02'), d('2026-04-03'))).toBe(0)
  })
})

describe('calendário de feriados', () => {
  it('calcula a Páscoa pelo algoritmo gregoriano', () => {
    expect(domingoDePascoa(2026).toISOString().slice(0, 10)).toBe('2026-04-05')
    expect(domingoDePascoa(2027).toISOString().slice(0, 10)).toBe('2027-03-28')
    expect(domingoDePascoa(2028).toISOString().slice(0, 10)).toBe('2028-04-16')
  })

  it('tem os 9 feriados fixos mais a Sexta-feira Santa', () => {
    const f = feriadosNacionais(2026)
    expect(f).toHaveLength(10)
    for (const data of [
      '2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-09-07',
      '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
    ]) expect(f).toContain(data)
  })

  it('inclui a Consciência Negra, feriado nacional desde a Lei 14.759/2023', () => {
    expect(feriadosNacionais(2026)).toContain('2026-11-20')
  })

  it('NÃO trata Carnaval e Corpus Christi como feriado — são ponto facultativo', () => {
    const f = feriadosNacionais(2026)
    expect(f).not.toContain('2026-02-17')   // terça de Carnaval
    expect(f).not.toContain('2026-06-04')   // Corpus Christi
    expect(pontosFacultativosNacionais(2026)).toEqual(
      ['2026-02-16', '2026-02-17', '2026-06-04'],
    )
  })

  it('cobre 2026, 2027 e 2028 — e nada além, para não fingir calendário que não tem', () => {
    expect(ehFeriado(new Date('2026-12-25T12:00:00'))).toBe(true)
    expect(ehFeriado(new Date('2027-12-25T12:00:00'))).toBe(true)
    expect(ehFeriado(new Date('2028-12-25T12:00:00'))).toBe(true)
    expect(ehFeriado(new Date('2029-12-25T12:00:00'))).toBe(false)
  })
})

describe('estadoDoPrazo', () => {
  it('dá estourado quando os dias parados passam do prazo', () => {
    expect(estadoDoPrazo({ situacaoId: 'ENVIADO_PARA_OPERADORA', diasParados: 3 })).toBe('estourado')
  })

  it('dá atencao quando falta menos de um dia', () => {
    expect(estadoDoPrazo({ situacaoId: 'ENVIADO_PARA_OPERADORA', diasParados: 2 })).toBe('atencao')
  })

  it('dá em-dia quando sobra mais de um dia', () => {
    expect(estadoDoPrazo({ situacaoId: 'CONTRATO_ASSINADO_INPUT', diasParados: 1 })).toBe('em-dia')
  })

  it('dá pausado em DEVOLVIDO — a bola está com o Comercial', () => {
    expect(estadoDoPrazo({ situacaoId: 'DEVOLVIDO', diasParados: 40 })).toBe('pausado')
  })

  it('dá encerrado em PEDIDO_FINALIZADO e em CANCELADO', () => {
    expect(estadoDoPrazo({ situacaoId: 'PEDIDO_FINALIZADO', diasParados: 9 })).toBe('encerrado')
    expect(estadoDoPrazo({ situacaoId: 'CANCELADO', diasParados: 9 })).toBe('encerrado')
  })

  it('em AGUARDANDO_PORTABILIDADE usa a data agendada, não a duração', () => {
    const hoje = d('2026-08-20')
    expect(estadoDoPrazo({
      situacaoId: 'AGUARDANDO_PORTABILIDADE', diasParados: 30,
      dataPortabilidade: '2026-08-25', hoje,
    })).toBe('em-dia')
    expect(estadoDoPrazo({
      situacaoId: 'AGUARDANDO_PORTABILIDADE', diasParados: 1,
      dataPortabilidade: '2026-08-19', hoje,
    })).toBe('estourado')
  })

  it('em PARADO fica estourado — é o status de quem já estourou e ninguém destravou', () => {
    expect(estadoDoPrazo({ situacaoId: 'PARADO', diasParados: 0 })).toBe('estourado')
  })
})
