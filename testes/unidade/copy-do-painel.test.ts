import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { montarPainel } from '@/consultas/painel'

/**
 * Título, frase de ação e mensagem vazia pertencem ao pacote de design — são
 * o que está nas capturas de tela e no tests.md da seção. Se alguém "melhorar"
 * uma frase aqui, a tela e a documentação passam a dizer coisas diferentes.
 */
describe('a copy do painel é a do pacote de design', () => {
  const origem = path.resolve(
    __dirname,
    '../../../esteira-design/product-plan/sections/painel-da-manha/sample-data.json',
  )

  it('bate em id, título, ação, tom e mensagem vazia — as quatro', async () => {
    const doDesign = JSON.parse(fs.readFileSync(origem, 'utf8')).perguntas as any[]
    const { perguntas } = await montarPainel()

    expect(perguntas.map((p) => p.id)).toEqual(doDesign.map((p) => p.id))

    for (const esperada of doDesign) {
      const nossa = perguntas.find((p) => p.id === esperada.id)!
      expect({
        titulo: nossa.titulo, acao: nossa.acao,
        tom: nossa.tom, mensagemVazia: nossa.mensagemVazia,
      }, `divergência em ${esperada.id}`).toEqual({
        titulo: esperada.titulo, acao: esperada.acao,
        tom: esperada.tom, mensagemVazia: esperada.mensagemVazia,
      })
    }
  })

  it('vermelho é exclusivo do cartão de prazo estourado', async () => {
    const { perguntas } = await montarPainel()
    expect(perguntas.filter((p) => p.tom === 'vermelho').map((p) => p.id))
      .toEqual(['prazo-estourado'])
  })
})
