import { describe, it, expect } from 'vitest'
import {
  emitirSessao, usuarioDaSessao, DURACAO_MS, ehAberto, semNavegacao, TROCA_DE_SENHA,
} from '@/dominio/sessao'

const SEGREDO = 'segredo-de-teste-nao-usado-em-lugar-nenhum'
const RAQUEL = { usuarioId: 7, precisaTrocarSenha: false }
const ESTREANDO = { usuarioId: 7, precisaTrocarSenha: true }
const HIAGO = 12

describe('sessão por pessoa', () => {
  it('devolve quem entrou, não apenas que alguém entrou', async () => {
    expect(await usuarioDaSessao(await emitirSessao(RAQUEL, SEGREDO), SEGREDO))
      .toEqual(RAQUEL)
  })

  it('o segredo nunca aparece no cookie', async () => {
    expect(await emitirSessao(RAQUEL, SEGREDO)).not.toContain(SEGREDO)
  })

  it('trocar o id no cookie não vira outra pessoa', async () => {
    const daRaquel = await emitirSessao(RAQUEL, SEGREDO)
    const [, validade, trocar, assinatura] = daRaquel.split('.')
    // O id faz parte do que foi assinado: trocá-lo quebra a assinatura. Sem
    // isto, virar outra pessoa seria editar um número no cookie.
    const forjado = `${HIAGO}.${validade}.${trocar}.${assinatura}`
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
    expect(await usuarioDaSessao(cookie, SEGREDO, agora + DURACAO_MS - 1000)).toEqual(RAQUEL)
    expect(await usuarioDaSessao(cookie, SEGREDO, agora + DURACAO_MS + 1000)).toBeNull()
  })

  it('adiantar a validade no cookie não estende a sessão', async () => {
    const agora = 1_770_000_000_000
    const cookie = await emitirSessao(RAQUEL, SEGREDO, agora)
    const [id, , trocar, assinatura] = cookie.split('.')
    const forjado = `${id}.${agora + 10 * DURACAO_MS}.${trocar}.${assinatura}`
    expect(await usuarioDaSessao(forjado, SEGREDO, agora)).toBeNull()
  })

  it('lixo não derruba a verificação', async () => {
    const ruins = [
      undefined, '', 'abc', '123', '.', '..', '...', '1.2', '1.2.3', '7.123.0',
      '1.2.0.zz', 'x.2.0.ab', '1.x.0.ab', '7.123.2.ab', '7.123.0.', '7.123.0.ABC',
      '1.2.0.3.4',
    ]
    for (const ruim of ruins) {
      expect(await usuarioDaSessao(ruim as string | undefined, SEGREDO)).toBeNull()
    }
  })

  it('sem segredo nenhum, nada vale', async () => {
    const cookie = await emitirSessao(RAQUEL, SEGREDO)
    expect(await usuarioDaSessao(cookie, '')).toBeNull()
  })
})

describe('a senha de estreia viaja assinada', () => {
  it('quem ainda não trocou é reconhecido como tal', async () => {
    const cookie = await emitirSessao(ESTREANDO, SEGREDO)
    expect(await usuarioDaSessao(cookie, SEGREDO)).toEqual(ESTREANDO)
  })

  it('apagar o aviso no cookie não pula a troca obrigatória', async () => {
    const cookie = await emitirSessao(ESTREANDO, SEGREDO)
    const [id, validade, , assinatura] = cookie.split('.')
    // Virar o `1` em `0` é a tentativa óbvia de pular a tela. O aviso faz parte
    // do que foi assinado: mexer nele derruba a sessão inteira.
    const forjado = `${id}.${validade}.0.${assinatura}`
    expect(await usuarioDaSessao(forjado, SEGREDO)).toBeNull()
  })

  it('e o contrário também não vale — ninguém empurra troca para outro', async () => {
    const cookie = await emitirSessao(RAQUEL, SEGREDO)
    const [id, validade, , assinatura] = cookie.split('.')
    expect(await usuarioDaSessao(`${id}.${validade}.1.${assinatura}`, SEGREDO)).toBeNull()
  })
})

describe('quais rotas escapam de quê', () => {
  it('só /entrar e /saude ficam abertos', () => {
    expect(ehAberto('/entrar')).toBe(true)
    expect(ehAberto('/saude')).toBe(true)
    expect(ehAberto('/painel')).toBe(false)
    expect(ehAberto('/pedidos/PED-2026-0001')).toBe(false)
    expect(ehAberto('/api/documentos/1')).toBe(false)
    // Prefixo parecido não abre a porta.
    expect(ehAberto('/entrarnafila')).toBe(false)
  })

  it('a troca de senha exige sessão — não é rota aberta', () => {
    // Se fosse, qualquer um abriria a tela de trocar senha sem estar logado.
    expect(ehAberto(TROCA_DE_SENHA)).toBe(false)
  })

  it('mas ela não leva a navegação do app', () => {
    expect(semNavegacao(TROCA_DE_SENHA)).toBe(true)
    expect(semNavegacao('/entrar')).toBe(true)
    expect(semNavegacao('/painel')).toBe(false)
  })
})
