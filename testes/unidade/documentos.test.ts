import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { DOCUMENTOS, documentosDe, faltamDocumentos, motivoDoBloqueio } from '@/dominio/documentos'

describe('documentos por tipo de pessoa', () => {
  it('o catálogo tem os seis do pacote de design, e só eles', () => {
    expect(DOCUMENTOS.map((d) => d.id)).toEqual([
      'contratoSocial', 'documentoRepresentante', 'faturaCnpj',
      'documentoPessoal', 'comprovanteResidencia', 'faturaOuTitularidade',
    ])
  })

  it('CNPJ pede três, dos quais dois obrigatórios', () => {
    const doCnpj = documentosDe('PJ')
    expect(doCnpj.map((d) => d.id)).toEqual([
      'contratoSocial', 'documentoRepresentante', 'faturaCnpj',
    ])
    expect(doCnpj.filter((d) => d.obrigatorio).map((d) => d.id))
      .toEqual(['contratoSocial', 'documentoRepresentante'])
  })

  it('CPF pede três, os três obrigatórios', () => {
    expect(documentosDe('PF').filter((d) => d.obrigatorio)).toHaveLength(3)
  })

  it('a fatura do CNPJ em branco não segura o pedido', () => {
    expect(faltamDocumentos('PJ', ['contratoSocial', 'documentoRepresentante'])).toEqual([])
  })

  it('sem contrato social, o pedido não passa', () => {
    expect(faltamDocumentos('PJ', ['documentoRepresentante'])).toEqual(['contratoSocial'])
  })

  it('documento de CPF anexado num pedido de CNPJ não conta', () => {
    expect(faltamDocumentos('PJ', ['documentoPessoal', 'comprovanteResidencia']))
      .toEqual(['contratoSocial', 'documentoRepresentante'])
  })

  it('o motivo do bloqueio conta certo no singular e no plural', () => {
    expect(motivoDoBloqueio([])).toBeNull()
    expect(motivoDoBloqueio(['contratoSocial'])).toBe('1 documento obrigatório não foi anexado')
    expect(motivoDoBloqueio(['contratoSocial', 'documentoRepresentante']))
      .toBe('2 documentos obrigatórios não foram anexados')
  })
})

/**
 * Rótulo e ajuda são o que está nas capturas de tela do pacote. "Melhorar" um
 * texto aqui faz a tela e a documentação dizerem coisas diferentes — e foi
 * exatamente o que o plano fez em `faturaOuTitularidade`.
 */
describe('o catálogo é o do pacote de design, campo a campo', () => {
  const origem = path.resolve(
    __dirname,
    '../../../esteira-design/product-plan/sections/entrada-do-pedido/sample-data.json',
  )

  it('bate em id, rótulo, ajuda, obrigatoriedade e tipo de pessoa', () => {
    const doDesign = JSON.parse(fs.readFileSync(origem, 'utf8')).opcoes.documentos
    expect(DOCUMENTOS.map((d) => ({ ...d }))).toEqual(doDesign)
  })
})
