/**
 * A sessão de acesso, enquanto não existe autenticação de verdade.
 *
 * Isto **não é** login: não há usuário, não há papel, e o autor das transições
 * continua sendo a constante do adaptador. É uma tranca na porta, para a URL
 * pública não ficar aberta a quem passar. A autenticação por pessoa é a
 * Tarefa 22, e é ela que torna o histórico auditável.
 *
 * O cookie guarda `validade.assinatura`, nunca a senha. Assinatura é
 * HMAC-SHA256 com a própria senha como chave — trocar a senha invalida toda
 * sessão em aberto, que é o comportamento desejado. Escrito com Web Crypto
 * porque o middleware roda no runtime Edge, onde `node:crypto` não existe.
 */

const ALGORITMO = { name: 'HMAC', hash: 'SHA-256' } as const

/** Oito horas: um turno. Quem trabalha o dia inteiro digita a senha uma vez. */
export const DURACAO_MS = 8 * 60 * 60 * 1000

async function chave(senha: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(senha), ALGORITMO, false, ['sign', 'verify'],
  )
}

const paraHex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('')

const deHex = (s: string) => {
  const bytes = new Uint8Array(s.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

/** Emite o valor do cookie para uma senha correta. `agora` entra para o teste. */
export async function emitirSessao(senha: string, agora = Date.now()): Promise<string> {
  const validade = String(agora + DURACAO_MS)
  const assinatura = await crypto.subtle.sign(ALGORITMO, await chave(senha), new TextEncoder().encode(validade))
  return `${validade}.${paraHex(assinatura)}`
}

/**
 * Diz se o cookie vale. Devolve `false` para qualquer coisa estranha — formato
 * errado, assinatura que não bate, prazo vencido — sem distinguir os casos: a
 * diferença só serviria para quem está tentando adivinhar.
 */
export async function sessaoValida(
  cookie: string | undefined, senha: string, agora = Date.now(),
): Promise<boolean> {
  if (!cookie) return false
  const [validade, assinatura] = cookie.split('.')
  if (!validade || !assinatura || !/^\d+$/.test(validade) || !/^[0-9a-f]+$/.test(assinatura)) return false
  if (Number(validade) < agora) return false

  // `verify` do Web Crypto compara em tempo constante.
  return crypto.subtle.verify(
    ALGORITMO, await chave(senha), deHex(assinatura), new TextEncoder().encode(validade),
  ).catch(() => false)
}

export const NOME_DO_COOKIE = 'esteira_sessao'

/**
 * Caminhos que a tranca não cobre.
 *
 * `/saude` fica de fora porque é por onde o Railway pergunta se o app subiu, e
 * ele não tem como digitar senha: protegendo, todo deploy seria reprovado no
 * healthcheck e revertido.
 */
export const ABERTOS = ['/entrar', '/saude']

export function ehAberto(caminho: string): boolean {
  return ABERTOS.some((a) => caminho === a || caminho.startsWith(`${a}/`))
}
