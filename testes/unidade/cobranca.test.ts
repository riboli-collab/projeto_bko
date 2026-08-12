import { describe, it, expect } from 'vitest'
import { calcularCobranca, cobrancaCalculavel } from '@/dominio/cobranca'

describe('cobrança do chip e da mensalidade', () => {
  it('cobra o chip uma vez e o plano todo mês', () => {
    const c = calcularCobranca({ precoVenda: 89.9, valorDoChip: 25, qtdLinhas: 10 })

    expect(c.mensal).toBe(899)              // 89,90 × 10 linhas
    expect(c.chipUmaVez).toBe(250)          // 25,00 × 10 chips
    expect(c.primeiraFatura).toBe(1149)     // as duas coisas juntas, uma vez só
  })

  it('a partir da segunda fatura o chip some', () => {
    const c = calcularCobranca({ precoVenda: 89.9, valorDoChip: 25, qtdLinhas: 10 })

    // É esta diferença que a tela precisa dizer: quem projeta receita com a
    // primeira fatura projeta R$ 250 a mais por mês, para sempre.
    expect(c.primeiraFatura - c.mensal).toBe(c.chipUmaVez)
    expect(c.mensal).toBeLessThan(c.primeiraFatura)
  })

  it('chip cortesia deixa a primeira fatura igual às outras', () => {
    const c = calcularCobranca({ precoVenda: 69.9, valorDoChip: 0, qtdLinhas: 3 })

    expect(c.semCobrancaDeChip).toBe(true)
    expect(c.primeiraFatura).toBe(c.mensal)
    expect(c.chipUmaVez).toBe(0)
  })

  it('não soma dinheiro em ponto flutuante', () => {
    // 0,1 + 0,2 é o caso clássico. Em centavos, 10,10 × 3 é exatamente 30,30.
    const c = calcularCobranca({ precoVenda: 10.1, valorDoChip: 0.2, qtdLinhas: 3 })

    expect(c.mensal).toBe(30.3)
    expect(c.chipUmaVez).toBe(0.6)
    expect(c.primeiraFatura).toBe(30.9)
  })

  it('o chip é por chip, e há um chip por linha', () => {
    const uma = calcularCobranca({ precoVenda: 50, valorDoChip: 30, qtdLinhas: 1 })
    const vinte = calcularCobranca({ precoVenda: 50, valorDoChip: 30, qtdLinhas: 20 })

    expect(uma.chipUmaVez).toBe(30)
    expect(vinte.chipUmaVez).toBe(600)
  })

  it('guarda o preço por linha separado do total, porque as duas telas pedem coisas diferentes', () => {
    // A ficha do pedido mostra "por linha"; a fila mostra o total do pedido.
    // Confundir os dois foi o defeito que existia em consultas/pedido.ts.
    const c = calcularCobranca({ precoVenda: 62.9, valorDoChip: 0, qtdLinhas: 8 })

    expect(c.planoPorLinha).toBe(62.9)
    expect(c.mensal).toBe(503.2)
  })

  it('soma com o que já foi digitado, sem esperar o formulário fechar', () => {
    const c = calcularCobranca({ precoVenda: 50, valorDoChip: null, qtdLinhas: 4 })

    expect(c.mensal).toBe(200)
    expect(c.chipUmaVez).toBe(0)
  })

  it('só é calculável com preço e quantidade — zero não informa nada', () => {
    expect(cobrancaCalculavel({ precoVenda: 50, qtdLinhas: 4 })).toBe(true)
    expect(cobrancaCalculavel({ precoVenda: null, qtdLinhas: 4 })).toBe(false)
    expect(cobrancaCalculavel({ precoVenda: 50, qtdLinhas: null })).toBe(false)
    expect(cobrancaCalculavel({ precoVenda: 0, qtdLinhas: 4 })).toBe(false)
  })
})

describe('eSIM não zera o chip por dedução', () => {
  it('cobra o que foi declarado, mesmo sem plástico para entregar', () => {
    // A função nem recebe o tipo de chip: quem decide se houve custo de
    // ativação é quem vendeu. Zero digitado é cortesia declarada; zero
    // deduzido apagaria a declaração — o mesmo princípio da DEC-2026-04.
    const c = calcularCobranca({ precoVenda: 79.9, valorDoChip: 15, qtdLinhas: 2 })

    expect(c.chipUmaVez).toBe(30)
    expect(c.semCobrancaDeChip).toBe(false)
  })
})
