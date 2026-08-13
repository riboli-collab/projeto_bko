import { describe, it, expect } from 'vitest'
import { emitirSessao, usuarioDaSessao, DURACAO_MS, ehAberto } from '@/dominio/sessao'

const SEGREDO = 'segredo-de-teste-nao-usado-em-lugar-nenhum'
const RAQUEL = 7
const HIAGO = 12

describe('sessão por pessoa', () => {
  it('devolve quem entrou, não apenas que alguém entrou', async () => {
    expect(await usuarioDaSessao(await emitirSessao(RAQUEL, SEGREDO), SEGREDO)).toBe(RAQUEL)
  })

  it('o segredo nunca aparece no cookie', async () => {
    expect(await emitirSessao(RAQUEL, SEGREDO)).not.toContain(SEGREDO)
  })

  it('trocar o id no cookie não vira outra pessoa', async () => {
    const daRaquel = await emitirSessao(RAQUEL, SEGREDO)
    const [, validade, assinatura] = daRaquel.split('.')
    // O id faz parte do que foi assinado: trocá-lo quebra a assinatura. Sem
    // isto, virar outra pessoa seria editar um número no cookie.
    const forjado = `${HIAGO}.${validade}.${assinatura}`
    expect(await usuarioDaSessao(forjado, SEGREDO)).toBeNull()
  })

  it('cookie de outro segredo não vale — não dá para forjar sem a chave', async () => {
    const alheio = await emitirSessao(RAQUEL, 'outro-segredo')
    expect(await usuarioDaSessao(alheio, SEGREDO)).toBeNull()
  })

  it('trocar o segredo derruba as sessões de todo mundo', async () => {
    const antigo = await emitirSessao(RAQUEL, SEGREDO)
    expect(await usuarioDaSessao(antigo, 'segredo-novo')).toBeNull()
  })

  it('vence depois de oito horas', async () => {
    const agora = 1_770_000_000_000
    const cookie = await emitirSessao(RAQUEL, SEGREDO, agora)
    expect(await usuarioDaSessao(cookie, SEGREDO, agora + DURACAO_MS - 1000)).toBe(RAQUEL)
    expect(await usuarioDaSessao(cookie, SEGREDO, agora + DURACAO_MS + 1000)).toBeNull()
  })

  it('adiantar a validade no cookie não estende a sessão', async () => {
    const agora = 1_770_000_000_000
    const cookie = await emitirSessao(RAQUEL, SEGREDO, agora)
    const [, , assinatura] = cookie.split('.')
    const forjado = `${RAQUEL}.${agora + 10 * DURACAO_MS}.${assinatura}`
    expect(await usuarioDaSessao(forjado, SEGREDO, agora)).toBeNull()
  })

  it('lixo não derruba a verificação', async () => {
    const ruins = [
      undefined, '', 'abc', '123', '.', '..', '1.2', '1.2.zz', 'x.2.ab',
      '1.x.ab', '7.123.', '7.123.ABC', '1.2.3.4',
    ]
    for (const ruim of ruins) {
      expect(await usuarioDaSessao(ruim as string | undefined, SEGREDO)).toBeNull()
    }
  })

  it('sem segredo nenhum, nada vale', async () => {
    const cookie = await emitirSessao(RAQUEL, SEGREDO)
    expect(await usuarioDaSessao(cookie, '')).toBeNull()
  })

  it('só /entrar e /saude ficam abertos', () => {
    expect(ehAberto('/entrar')).toBe(true)
    expect(ehAberto('/saude')).toBe(true)
    expect(ehAberto('/painel')).toBe(false)
    expect(ehAberto('/pedidos/PED-2026-0001')).toBe(false)
    expect(ehAberto('/api/documentos/1')).toBe(false)
    // Prefixo parecido não abre a porta.
    expect(ehAberto('/entrarnafila')).toBe(false)
  })
})
