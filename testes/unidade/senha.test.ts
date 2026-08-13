import { describe, it, expect } from 'vitest'
import { gerarHash, conferirSenha, senhaSorteada } from '@/dominio/senha'

const SENHA = 'senha-de-teste-nao-usada-em-lugar-nenhum'

describe('guardar e conferir senha', () => {
  it('confere a senha certa e recusa a errada', async () => {
    const hash = await gerarHash(SENHA)
    expect(await conferirSenha(SENHA, hash)).toBe(true)
    expect(await conferirSenha(`${SENHA}x`, hash)).toBe(false)
    expect(await conferirSenha('', hash)).toBe(false)
  })

  it('a senha não aparece no que é guardado', async () => {
    const hash = await gerarHash(SENHA)
    expect(hash).not.toContain(SENHA)
  })

  it('a mesma senha gera hashes diferentes — o sal é por senha', async () => {
    const [a, b] = [await gerarHash(SENHA), await gerarHash(SENHA)]
    expect(a).not.toBe(b)
    // E os dois continuam conferindo: o sal viaja junto do hash.
    expect(await conferirSenha(SENHA, a)).toBe(true)
    expect(await conferirSenha(SENHA, b)).toBe(true)
  })

  it('grava os parâmetros junto, para poder encarecê-los depois sem invalidar ninguém', async () => {
    const hash = await gerarHash(SENHA)
    const [algoritmo, n, r, p] = hash.split('$')
    expect(algoritmo).toBe('scrypt')
    expect(Number(n)).toBeGreaterThanOrEqual(16_384)
    expect([r, p]).toEqual(['8', '1'])
  })

  it('hash estragado recusa em vez de explodir', async () => {
    const ruins = [
      '', 'x', 'scrypt$abc', 'md5$1$1$1$aa$bb', 'scrypt$16384$8$1$zz$zz',
      'scrypt$16384$8$1$aa', 'scrypt$16384$8$1$aa$bb$cc',
    ]
    for (const ruim of ruins) {
      expect(await conferirSenha(SENHA, ruim)).toBe(false)
    }
  })

  it('aceita acento e espaço — senha é frase, não identificador', async () => {
    const frase = 'coração de manteiga em Chapecó'
    expect(await conferirSenha(frase, await gerarHash(frase))).toBe(true)
  })
})

describe('senha sorteada para entregar', () => {
  it('não repete', () => {
    const cem = new Set(Array.from({ length: 100 }, () => senhaSorteada()))
    expect(cem.size).toBe(100)
  })

  it('não usa caractere ambíguo — a senha vai ser lida em voz alta', () => {
    const muitas = Array.from({ length: 200 }, () => senhaSorteada()).join('')
    for (const ambiguo of ['0', 'O', '1', 'l', 'I']) {
      expect(muitas).not.toContain(ambiguo)
    }
  })

  it('tem o tamanho pedido, mesmo com o descarte do viés de módulo', () => {
    for (const tamanho of [8, 14, 20, 40]) {
      expect(senhaSorteada(tamanho)).toHaveLength(tamanho)
    }
  })

  it('distribui sem viés — nenhuma letra sai muito mais que as outras', () => {
    /**
     * O tamanho da amostra e a tolerância não são chutes.
     *
     * O alfabeto tem 55 letras e o byte tem 256 valores. Com `byte % 55`, as 36
     * primeiras letras receberiam 5 dos 256 valores e as 19 últimas, 4 — as
     * raras sairiam 14% abaixo da média. É esse 14% que o teste precisa
     * enxergar sem acusar o acaso.
     *
     * Com N caracteres, o desvio padrão relativo de cada contagem é √(55/N).
     * Em 200.000, dá 1,7%; o pior dos 55 desvios fica perto de 3,5 vezes isso,
     * ou 6%. A tolerância de 10% deixa quase 6 desvios de folga contra a sorte
     * e ainda pega os 14% do viés com sobra.
     */
    const TOTAL = 200_000
    const amostra = Array.from({ length: TOTAL / 40 }, () => senhaSorteada(40)).join('')
    const contagem = new Map<string, number>()
    for (const c of amostra) contagem.set(c, (contagem.get(c) ?? 0) + 1)

    expect(contagem.size).toBe(55)
    const valores = [...contagem.values()]
    const esperado = amostra.length / 55
    expect(Math.max(...valores)).toBeLessThan(esperado * 1.1)
    expect(Math.min(...valores)).toBeGreaterThan(esperado * 0.9)
  })
})
