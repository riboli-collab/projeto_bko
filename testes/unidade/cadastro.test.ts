import { describe, it, expect } from 'vitest'
import { preencherComOCadastro, type CadastroDoCliente } from '@/dominio/cadastro'

const ENDERECO = {
  logradouro: 'Rua das Flores', numero: '100', complemento: 'sala 3',
  bairro: 'Centro', cidade: 'Porto Alegre', estado: 'RS', cep: '90010-000',
}

const COMPLETO: CadastroDoCliente = {
  cnpjCpf: '11222333000181',
  razaoSocial: 'Alfa Telecom LTDA',
  contato: 'Fernando Ribeiro',
  telefone: '(51) 99812-4470',
  emailAssinatura: 'assina@exemplo.com.br',
  emailFinanceiro: 'financeiro@exemplo.com.br',
  enderecoFiscal: ENDERECO,
}

describe('preencher o formulário com o cadastro da base', () => {
  it('traz os seis campos que a tela promete ter trazido', () => {
    const { valores, vindosDaBase } = preencherComOCadastro(COMPLETO)

    // BuscaDeCliente.tsx diz, na tela: "Nome, endereço fiscal, contato,
    // telefone e os dois e-mails vieram do cadastro". São estes seis.
    expect(vindosDaBase.sort()).toEqual([
      'contato', 'emailAssinatura', 'emailFinanceiro',
      'enderecoFiscal', 'razaoSocial', 'telefone',
    ])
    expect(valores.razaoSocial).toBe('Alfa Telecom LTDA')
    expect(valores.telefone).toBe('(51) 99812-4470')
    expect(valores.emailAssinatura).toBe('assina@exemplo.com.br')
    expect(valores.enderecoFiscal).toEqual(ENDERECO)
    expect(valores.cnpjCpf).toBe('11222333000181')
  })

  it('vazio na base não vira valor — é o que 1.108 dos 1.126 cadastros têm', () => {
    // Telefone, e-mail de assinatura e endereço fiscal não existem na origem.
    // Copiar a string vazia por cima apagaria o que o Comercial acabou de digitar.
    const magro: CadastroDoCliente = {
      ...COMPLETO, telefone: '', emailAssinatura: '', enderecoFiscal: null,
    }
    const { valores, vindosDaBase } = preencherComOCadastro(magro)

    expect(vindosDaBase.sort()).toEqual(['contato', 'emailFinanceiro', 'razaoSocial'])
    expect('telefone' in valores).toBe(false)
    expect('emailAssinatura' in valores).toBe(false)
    expect('enderecoFiscal' in valores).toBe(false)
  })

  it('endereço pela metade também não vale', () => {
    // Um endereço sem cidade nem CEP não preenche o bloco: derramá-lo no
    // formulário marcaria como "veio da base" um campo que continua faltando.
    const meio = { ...ENDERECO, cidade: '', cep: '' }
    const { vindosDaBase } = preencherComOCadastro({ ...COMPLETO, enderecoFiscal: meio })

    expect(vindosDaBase).not.toContain('enderecoFiscal')
  })

  it('complemento em branco não impede o endereço de vir', () => {
    const semComplemento = { ...ENDERECO, complemento: '' }
    const { valores, vindosDaBase } = preencherComOCadastro({
      ...COMPLETO, enderecoFiscal: semComplemento,
    })

    expect(vindosDaBase).toContain('enderecoFiscal')
    expect(valores.enderecoFiscal).toEqual(semComplemento)
  })

  it('só espaço em branco conta como vazio', () => {
    const { vindosDaBase } = preencherComOCadastro({ ...COMPLETO, telefone: '   ' })
    expect(vindosDaBase).not.toContain('telefone')
  })

  it('não inventa campo que não é cadastro', () => {
    const { valores } = preencherComOCadastro(COMPLETO)

    // Plano, preço e empresa faturadora não são cadastro de cliente — e a
    // faturadora, em especial, nunca é deduzida (DEC-2026-04).
    expect('planoId' in valores).toBe(false)
    expect('precoVenda' in valores).toBe(false)
    expect('empresaFaturadora' in valores).toBe(false)
  })
})
