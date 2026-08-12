import { describe, it, expect } from 'vitest'
import { validarPedido, contatoEstaCompleto } from '@/dominio/validacao-do-pedido'
import type { EntradaDePedido } from '@/app/acoes/criar-pedido'

const ENDERECO = {
  logradouro: 'Rua das Palmeiras', numero: '120', complemento: 'Sala 3',
  bairro: 'Centro', cidade: 'Chapecó', estado: 'SC', cep: '89801000',
}

const VALIDO: EntradaDePedido = {
  cnpjCpf: '11222333000181', razaoSocial: 'Comércio Exemplo Ltda',
  enderecoFiscal: ENDERECO, contato: 'Fernando Ribeiro', telefone: '49988887777',
  emailAssinatura: 'assina@exemplo.com.br', emailFinanceiro: 'financeiro@exemplo.com.br',
  qtdLinhas: 4, canalDeVenda: 'IG', operadora: 'Claro', planoId: 'claro-ilimitado-12',
  precoVenda: 49.9, valorDoChip: 0, empresaFaturadora: 'IG', tipo: 'Linha nova',
  tipoDeChip: 'Físico', formaDeEntrega: 'Motoboy',
  enderecoDeEntrega: { ...ENDERECO, recebedor: 'Fernando Ribeiro' },
  dataPortabilidade: null, vendedor: 'Carlos', observacao: '',
}

describe('validação dos 17 campos', () => {
  it('não reclama de um pedido completo', () => {
    expect(validarPedido(VALIDO)).toEqual({})
  })

  it('devolve os três erros de uma vez, não o primeiro', () => {
    const erros = validarPedido({
      ...VALIDO, cnpjCpf: '112223330001', telefone: '4999', emailFinanceiro: 'financeiro@',
    })
    expect(Object.keys(erros).sort()).toEqual(['cnpjCpf', 'emailFinanceiro', 'telefone'])
  })

  it('diz quantos dígitos vieram, em vez de "formato inválido"', () => {
    expect(validarPedido({ ...VALIDO, cnpjCpf: '112223330001' }).cnpjCpf)
      .toBe('CNPJ tem 14 dígitos e CPF tem 11 — você digitou 12')
  })

  it('recusa contato com só o primeiro nome — 1.108 dos 1.126 da base', () => {
    expect(contatoEstaCompleto('CLAUDIA')).toBe(false)
    expect(contatoEstaCompleto('Claudia Menezes')).toBe(true)
    expect(validarPedido({ ...VALIDO, contato: 'CLAUDIA' }).contato)
      .toBe('Contato precisa de nome e sobrenome — o cadastro trouxe só "CLAUDIA"')
  })

  it('empresa faturadora em branco não passa', () => {
    expect(validarPedido({ ...VALIDO, empresaFaturadora: '' as never }).empresaFaturadora)
      .toBe('Empresa faturadora em branco não passa, e não se preenche por dedução')
  })

  it('cobra os campos que faltam no endereço fiscal, nomeando cada um', () => {
    const erros = validarPedido({
      ...VALIDO, enderecoFiscal: { ...ENDERECO, cidade: '', cep: '' },
    })
    expect(erros.enderecoFiscal).toBe('Endereço fiscal sem cidade e sem CEP')
  })

  it('CEP com menos de 8 dígitos é erro de formato, não campo vazio', () => {
    expect(validarPedido({ ...VALIDO, enderecoFiscal: { ...ENDERECO, cep: '898010' } }).enderecoFiscal)
      .toBe('CEP tem 8 dígitos — você digitou 6')
  })

  it('motoboy e Correios exigem endereço de entrega com recebedor', () => {
    const erros = validarPedido({ ...VALIDO, enderecoDeEntrega: null })
    expect(erros.formaDeEntrega).toBe('Motoboy exige endereço de entrega e o nome de quem recebe')
  })

  it('retirada no escritório não pede endereço de entrega', () => {
    expect(validarPedido({
      ...VALIDO, formaDeEntrega: 'Retirada no escritório', enderecoDeEntrega: null,
    })).toEqual({})
  })

  it('chip físico exige forma de entrega; eSIM exige que ela seja nula', () => {
    expect(validarPedido({ ...VALIDO, formaDeEntrega: null }).formaDeEntrega)
      .toBe('Chip físico exige forma de entrega')
    expect(validarPedido({
      ...VALIDO, tipoDeChip: 'eSIM', formaDeEntrega: 'Motoboy', enderecoDeEntrega: null,
    }).formaDeEntrega).toBe('eSIM não tem o que entregar — deixe a forma de entrega em branco')
  })

  it('eSIM completo tem 16 campos e passa', () => {
    expect(validarPedido({
      ...VALIDO, tipoDeChip: 'eSIM', formaDeEntrega: null, enderecoDeEntrega: null,
    })).toEqual({})
  })

  it('portabilidade exige a data agendada, e ela não pode ter passado', () => {
    expect(validarPedido({ ...VALIDO, tipo: 'Portabilidade', dataPortabilidade: null }).tipoDeAcao)
      .toBe('Portabilidade exige a data agendada')
    expect(validarPedido({
      ...VALIDO, tipo: 'Portabilidade', dataPortabilidade: '2020-01-10',
    }).tipoDeAcao).toBe('A data de portabilidade já passou — 10/01/2020')
  })

  it('valor do chip zero é válido; negativo não', () => {
    expect(validarPedido({ ...VALIDO, valorDoChip: 0 })).toEqual({})
    expect(validarPedido({ ...VALIDO, valorDoChip: -1 }).valorDoChip)
      .toBe('Valor do chip não pode ser negativo. Zero é válido — chip cortesia acontece')
  })

  it('quantidade de linhas precisa ser inteira e maior que zero', () => {
    expect(validarPedido({ ...VALIDO, qtdLinhas: 2.5 }).qtdLinhas)
      .toBe('Quantidade de linhas é um número inteiro de linhas')
    expect(validarPedido({ ...VALIDO, qtdLinhas: 0 }).qtdLinhas)
      .toBe('Quantidade de linhas precisa ser maior que zero')
  })
})
