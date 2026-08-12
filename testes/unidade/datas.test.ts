import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dataDoDesign, dataHoraDoDesign, horaDoDesign, diaMesDoDesign } from '@/dominio/datas'

/**
 * O pacote de design não usa ISO. Mandar `toISOString()` para a tela não dá
 * erro nenhum: só escreve `2026-08-12T22:13:10.006Z` onde deveria estar `19:13`,
 * e o defeito só aparece para quem lê. Foi assim que ele chegou em produção.
 */
describe('as datas têm o formato que o pacote de design espera', () => {
  const d = new Date(2026, 7, 12, 19, 5)

  it('data é YYYY-MM-DD', () => {
    expect(dataDoDesign(d)).toBe('2026-08-12')
  })

  it('data e hora é YYYY-MM-DD HH:MM, sem T e sem Z', () => {
    expect(dataHoraDoDesign(d)).toBe('2026-08-12 19:05')
  })

  it('hora sozinha é HH:MM', () => {
    expect(horaDoDesign(d)).toBe('19:05')
  })

  it('dia/mês sai do texto, nunca de um Date', () => {
    // `new Date('2026-08-13')` é meia-noite UTC — 21h do dia 12 em Chapecó.
    // A portabilidade de amanhã apareceria como sendo de hoje.
    expect(diaMesDoDesign('2026-08-13')).toBe('13/08')
    expect(diaMesDoDesign('2026-01-01')).toBe('01/01')
  })
})

describe('o formato bate com o sample-data do pacote', () => {
  const raiz = path.resolve(__dirname, '../../../esteira-design/product-plan/sections')

  it('o resumo do painel usa só a hora', () => {
    const d = JSON.parse(fs.readFileSync(path.join(raiz, 'painel-da-manha/sample-data.json'), 'utf8'))
    expect(d.resumo.atualizadoEm).toMatch(/^\d{2}:\d{2}$/)
    expect(horaDoDesign(new Date())).toMatch(/^\d{2}:\d{2}$/)
  })

  it('a confirmação do envio usa data e hora, sem ISO', () => {
    const d = JSON.parse(fs.readFileSync(path.join(raiz, 'entrada-do-pedido/sample-data.json'), 'utf8'))
    expect(d.resultadoDoEnvio.enviadoEm).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(dataHoraDoDesign(new Date())).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})
