import { describe, it, expect } from 'vitest'
import { validarNovaSenha, MINIMO, CONHECIDAS } from '@/dominio/regra-da-senha'

const BOA = 'chapeco-2026-sc'

describe('o que vale como senha nova', () => {
  it('aceita uma senha decente', () => {
    expect(validarNovaSenha(BOA, BOA)).toBeNull()
  })

  it('recusa a senha de estreia — senão a troca termina onde começou', () => {
    expect(validarNovaSenha('123456', '123456')).not.toBeNull()
  })

  it('recusa todas as da lista, com e sem caixa ou acento', () => {
    for (const fraca of CONHECIDAS) {
      expect(validarNovaSenha(fraca, fraca), fraca).not.toBeNull()
      expect(validarNovaSenha(fraca.toUpperCase(), fraca.toUpperCase()), fraca).not.toBeNull()
    }
    // "sênha" normaliza para "senha", que está na lista.
    expect(validarNovaSenha('sênha', 'sênha')).not.toBeNull()
  })

  it(`recusa menos de ${MINIMO} caracteres`, () => {
    expect(validarNovaSenha('abc1234', 'abc1234')).toContain(String(MINIMO))
    expect(validarNovaSenha('abcd1234', 'abcd1234')).toBeNull()
  })

  it('recusa só números, mesmo longos — data de nascimento é o caso comum', () => {
    expect(validarNovaSenha('20031995', '20031995')).not.toBeNull()
    expect(validarNovaSenha('9876543210', '9876543210')).not.toBeNull()
  })

  it('recusa quando a confirmação não bate', () => {
    expect(validarNovaSenha(BOA, `${BOA}x`)).toBe('As duas senhas não são iguais.')
  })

  it('cobra o tamanho antes da confirmação — um problema de cada vez', () => {
    // Curta E diferente: a mensagem é a do tamanho, que é o que se corrige primeiro.
    expect(validarNovaSenha('ab', 'zz')).toContain(String(MINIMO))
  })

  it('aceita acento e espaço — senha é frase, não identificador', () => {
    const frase = 'coração de manteiga'
    expect(validarNovaSenha(frase, frase)).toBeNull()
  })
})
