import { describe, it, expect } from 'vitest'
import { compararComABase, valoresDaBase } from '@/dominio/divergencias'

const BASE = {
  cnpjCpf: '11222333000181',
  razaoSocial: 'Comércio Exemplo Ltda',
  contato: 'Fernando Ribeiro',
  telefone: '49988887777',
  emailAssinatura: '',
  emailFinanceiro: 'financeiro@exemplo.com.br',
}

describe('divergência entre o digitado e a base', () => {
  it('não vê divergência quando os dois são iguais', () => {
    expect(compararComABase({ ...BASE }, BASE)).toEqual([])
  })

  it('aponta o campo, com os dois valores lado a lado', () => {
    const d = compararComABase({ ...BASE, razaoSocial: 'Comercio Exemplo ME' }, BASE)
    expect(d).toEqual([{
      campoId: 'razaoSocial', rotulo: 'Razão social',
      valorDigitado: 'Comercio Exemplo ME', valorDaBase: 'Comércio Exemplo Ltda',
    }])
  })

  it('campo vazio na base não é divergência — é campo que a base não tem', () => {
    expect(compararComABase({ ...BASE, emailAssinatura: 'assina@exemplo.com.br' }, BASE)).toEqual([])
  })

  it('ignora diferença só de espaço e de caixa', () => {
    expect(compararComABase({ ...BASE, razaoSocial: '  comércio exemplo ltda ' }, BASE)).toEqual([])
  })

  it('ignora diferença só de acento', () => {
    expect(compararComABase({ ...BASE, razaoSocial: 'Comercio Exemplo Ltda' }, BASE)).toEqual([])
  })

  it('completar o contato da base não conta como divergir dela', () => {
    // 1.108 dos 1.126 vêm com só o primeiro nome. Completar é o que se pede.
    expect(compararComABase({ ...BASE, contato: 'Fernando Ribeiro' },
      { ...BASE, contato: 'FERNANDO' })).toEqual([])
  })

  it('trocar o contato por outra pessoa é divergência', () => {
    const d = compararComABase({ ...BASE, contato: 'Marcia Souza' }, { ...BASE, contato: 'FERNANDO' })
    expect(d.map((x) => x.campoId)).toEqual(['contato'])
  })

  it('completar não vale para os outros campos — só o contato vem truncado', () => {
    // "Comércio Exemplo" virando "Comércio Exemplo Ltda" muda a pessoa jurídica.
    const d = compararComABase({ ...BASE, razaoSocial: 'Comércio Exemplo Ltda ME' }, BASE)
    expect(d.map((x) => x.campoId)).toEqual(['razaoSocial'])
  })

  it('aponta os dois campos quando os dois divergem', () => {
    const d = compararComABase(
      { ...BASE, razaoSocial: 'Outra Razão', telefone: '4933334444' }, BASE,
    )
    expect(d.map((x) => x.campoId)).toEqual(['razaoSocial', 'telefone'])
  })
})

describe('seguir com o da base', () => {
  it('devolve só os campos que divergiram, com o valor da base', () => {
    const d = compararComABase(
      { ...BASE, razaoSocial: 'Outra Razão', telefone: '4933334444' }, BASE,
    )
    // O botão diz "seguir com o da base": sem isto ele mentiria, e o pedido
    // seguiria com o que a tela mostra, que é o digitado.
    expect(valoresDaBase(d)).toEqual({
      razaoSocial: 'Comércio Exemplo Ltda',
      telefone: '49988887777',
    })
  })

  it('sem divergência, não mexe em campo nenhum', () => {
    expect(valoresDaBase([])).toEqual({})
  })
})
