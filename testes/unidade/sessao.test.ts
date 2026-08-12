import { describe, it, expect } from 'vitest'
import { emitirSessao, sessaoValida, DURACAO_MS, ehAberto } from '@/dominio/sessao'

const SENHA = 'senha-de-teste-nao-usada-em-lugar-nenhum'

describe('sessão de acesso', () => {
  it('o cookie que ela emite vale', async () => {
    expect(await sessaoValida(await emitirSessao(SENHA), SENHA)).toBe(true)
  })

  it('a senha nunca aparece no cookie', async () => {
    expect(await emitirSessao(SENHA)).not.toContain(SENHA)
  })

  it('cookie de outra senha não vale — não dá para forjar sem a chave', async () => {
    const alheio = await emitirSessao('outra-senha')
    expect(await sessaoValida(alheio, SENHA)).toBe(false)
  })

  it('trocar a senha derruba as sessões em aberto', async () => {
    const antigo = await emitirSessao(SENHA)
    expect(await sessaoValida(antigo, 'senha-nova')).toBe(false)
  })

  it('vence depois de oito horas', async () => {
    const agora = 1_770_000_000_000
    const cookie = await emitirSessao(SENHA, agora)
    expect(await sessaoValida(cookie, SENHA, agora + DURACAO_MS - 1000)).toBe(true)
    expect(await sessaoValida(cookie, SENHA, agora + DURACAO_MS + 1000)).toBe(false)
  })

  it('adiantar a validade no cookie não estende a sessão', async () => {
    const agora = 1_770_000_000_000
    const cookie = await emitirSessao(SENHA, agora)
    const [, assinatura] = cookie.split('.')
    const forjado = `${agora + 10 * DURACAO_MS}.${assinatura}`
    // A validade faz parte do que foi assinado: mexer nela quebra a assinatura.
    expect(await sessaoValida(forjado, SENHA, agora)).toBe(false)
  })

  it('lixo não derruba a verificação', async () => {
    for (const ruim of [undefined, '', 'abc', '123', '.', '123.', '.abc', 'x.y', '123.zz']) {
      expect(await sessaoValida(ruim as string | undefined, SENHA)).toBe(false)
    }
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
