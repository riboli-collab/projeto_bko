/**
 * A sessão de uma pessoa.
 *
 * O cookie é `id.validade.assinatura`, onde a assinatura é HMAC-SHA256 de
 * `id.validade` com `SEGREDO_DA_SESSAO`. Ele diz **quem** entrou, e é isso que
 * torna o histórico auditável: o autor de cada transição sai daqui, não de uma
 * constante no adaptador nem de um campo que o navegador manda.
 *
 * A assinatura usa um segredo do servidor, e não a senha da pessoa, por dois
 * motivos. O proxy precisa validar a sessão no runtime Edge, onde não há banco
 * para buscar o hash de cada usuário — e a senha da pessoa não deve viajar
 * como chave de nada além do próprio login. Trocar o segredo derruba todas as
 * sessões de todo mundo, que é o botão de pânico.
 *
 * Escrito com Web Crypto porque o proxy roda no Edge, onde `node:crypto` não
 * existe. `dominio/senha.ts`, que usa scrypt do Node, **não** pode ser
 * importado a partir daqui nem do proxy.
 */

const ALGORITMO = { name: 'HMAC', hash: 'SHA-256' } as const

/** Oito horas: um turno. Quem trabalha o dia inteiro entra uma vez. */
export const DURACAO_MS = 8 * 60 * 60 * 1000

export const NOME_DO_COOKIE = 'esteira_sessao'

async function chave(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(segredo), ALGORITMO, false, ['sign', 'verify'],
  )
}

const paraHex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('')

const deHex = (s: string) => {
  const bytes = new Uint8Array(s.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

export interface Sessao {
  usuarioId: number
  /**
   * A senha ainda é a que quem administra definiu.
   *
   * Viaja **dentro** do que é assinado para o proxy poder decidir no Edge, sem
   * banco. Fora da assinatura, trocar um `1` por `0` no cookie burlaria a troca
   * obrigatória — que é justamente o que ela existe para impedir.
   */
  precisaTrocarSenha: boolean
}

/** Emite o cookie para um usuário já autenticado. `agora` entra para o teste. */
export async function emitirSessao(
  sessao: Sessao, segredo: string, agora = Date.now(),
): Promise<string> {
  const corpo = `${sessao.usuarioId}.${agora + DURACAO_MS}.${sessao.precisaTrocarSenha ? 1 : 0}`
  const assinatura = await crypto.subtle.sign(
    ALGORITMO, await chave(segredo), new TextEncoder().encode(corpo),
  )
  return `${corpo}.${paraHex(assinatura)}`
}

/**
 * Devolve o id de quem está na sessão, ou `null`.
 *
 * `null` para qualquer coisa estranha — formato errado, assinatura que não
 * bate, prazo vencido — sem distinguir os casos: a diferença só serviria para
 * quem está tentando adivinhar.
 *
 * Note que isto **não** consulta o banco: o proxy roda no Edge e valida milhares
 * de requisições. Quem precisa do nome ou do papel busca depois, no servidor.
 * A consequência é que desativar alguém só faz efeito na próxima sessão — por
 * isso `exigirUsuario` confere `ativo` a cada ação que escreve.
 */
export async function usuarioDaSessao(
  cookie: string | undefined, segredo: string, agora = Date.now(),
): Promise<Sessao | null> {
  if (!cookie) return null
  // Segredo vazio recusa em vez de estourar: `importKey` lança DataError com
  // chave de comprimento zero, e uma variável definida como string vazia
  // derrubaria toda requisição com erro 500 em vez de mandar para a entrada.
  if (!segredo) return null

  const partes = cookie.split('.')
  if (partes.length !== 4) return null
  const [id, validade, trocar, assinatura] = partes

  if (!/^\d+$/.test(id) || !/^\d+$/.test(validade)) return null
  if (trocar !== '0' && trocar !== '1') return null
  if (!/^[0-9a-f]+$/.test(assinatura)) return null
  if (Number(validade) < agora) return null

  // `verify` do Web Crypto compara em tempo constante.
  const confere = await crypto.subtle.verify(
    ALGORITMO, await chave(segredo), deHex(assinatura),
    new TextEncoder().encode(`${id}.${validade}.${trocar}`),
  ).catch(() => false)

  return confere ? { usuarioId: Number(id), precisaTrocarSenha: trocar === '1' } : null
}

/**
 * Caminhos que a tranca não cobre.
 *
 * `/saude` fica de fora porque é por onde o Railway pergunta se o app subiu, e
 * ele não tem como digitar senha: protegendo, todo deploy seria reprovado no
 * healthcheck e revertido, com a aplicação funcionando.
 */
export const ABERTOS = ['/entrar', '/saude']

export function ehAberto(caminho: string): boolean {
  return ABERTOS.some((a) => caminho === a || caminho.startsWith(`${a}/`))
}

/**
 * Onde a troca de senha acontece.
 *
 * **Não** é rota aberta: exige sessão. O que ela tem de especial é ser a única
 * que abre enquanto a senha ainda é a de estreia — sem essa exceção, a troca
 * obrigatória redirecionaria a própria tela de troca, em círculo.
 */
export const TROCA_DE_SENHA = '/trocar-senha'

/** A tela não leva a navegação do app: é uma tarefa só, e ela ocupa a tela. */
export function semNavegacao(caminho: string): boolean {
  return ehAberto(caminho) || caminho === TROCA_DE_SENHA
}
