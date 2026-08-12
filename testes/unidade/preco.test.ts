import { describe, it, expect } from 'vitest'
import { responsavelPor, empresaSugeridaPelaOperadora } from '@/dominio/roteamento'
import { formatarNumero } from '@/dominio/numeracao'
import { avaliarPreco } from '@/dominio/preco'

describe('roteamento por operadora', () => {
  it('manda Vivo e 2BX para Gabrielle', () => {
    expect(responsavelPor('Vivo')).toBe('Gabrielle Souza')
    expect(responsavelPor('2BX')).toBe('Gabrielle Souza')
  })

  it('manda Claro e TIM para Hiago', () => {
    expect(responsavelPor('Claro')).toBe('Hiago Ferreira')
    expect(responsavelPor('TIM')).toBe('Hiago Ferreira')
  })

  it('sugere a empresa só para conferência, e a função diz isso no nome', () => {
    expect(empresaSugeridaPelaOperadora('Vivo')).toBe('MAN')
    expect(empresaSugeridaPelaOperadora('Claro')).toBe('IG')
    expect(empresaSugeridaPelaOperadora('2BX')).toBe('2BX')
  })
})

describe('numeração', () => {
  it('formata com quatro dígitos', () => {
    expect(formatarNumero(2026, 1)).toBe('PED-2026-0001')
    expect(formatarNumero(2026, 163)).toBe('PED-2026-0163')
  })

  it('não trunca acima de 9999', () => {
    expect(formatarNumero(2026, 10042)).toBe('PED-2026-10042')
  })
})

describe('trava de preço', () => {
  const vivo6 = {
    id: 'vivo-ilimitado-6', nome: 'ilimitado 6 GB', operadora: 'Vivo' as const,
    custoPorLinha: 14.99, origem: 'contrato' as const,
  }

  it('libera preço acima do custo, dizendo a procedência', () => {
    expect(avaliarPreco({ precoVenda: 24.99, plano: vivo6 })).toEqual({ tipo: 'ok', origem: 'contrato' })
  })

  it('bloqueia preço abaixo do custo, com a diferença calculada', () => {
    const r = avaliarPreco({ precoVenda: 12.0, plano: vivo6 })
    expect(r).toEqual({
      tipo: 'bloqueado',
      bloqueio: {
        custoPorLinha: 14.99, precoInformado: 12.0, diferenca: 2.99,
        planoNome: 'ilimitado 6 GB', origem: 'contrato',
      },
    })
  })

  it('trata preço igual ao custo como liberado', () => {
    expect(avaliarPreco({ precoVenda: 14.99, plano: vivo6 })).toMatchObject({ tipo: 'ok' })
  })

  it('não arredonda a diferença para menos', () => {
    const r = avaliarPreco({ precoVenda: 14.98, plano: vivo6 })
    expect(r).toMatchObject({ tipo: 'bloqueado', bloqueio: { diferenca: 0.01 } })
  })

  it('bloqueia igual com custo lançado, mas marca que não foi conferido', () => {
    const claro1 = {
      id: 'claro-ilimitado-1', nome: 'ilimitado 1 GB', operadora: 'Claro' as const,
      custoPorLinha: 14.99, origem: 'lancado' as const,
    }
    const r = avaliarPreco({ precoVenda: 10.0, plano: claro1 })
    expect(r).toMatchObject({ tipo: 'bloqueado', bloqueio: { origem: 'lancado', diferenca: 4.99 } })
  })

  it('diz "sem custo" quando não há custo nenhum — nunca finge que passou', () => {
    const orfao = {
      id: 'orfao', nome: 'plano sem operadora', operadora: '2BX' as const,
      custoPorLinha: null, origem: 'ausente' as const,
    }
    expect(avaliarPreco({ precoVenda: 1.0, plano: orfao })).toEqual({
      tipo: 'sem-custo', planoNome: 'plano sem operadora',
    })
  })
})
