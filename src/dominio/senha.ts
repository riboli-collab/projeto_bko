import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Guardar e conferir senha.
 *
 * `scrypt` do `node:crypto` — sem dependência nova. É deliberadamente lento e
 * caro em memória, que é o ponto: quem levar o banco embora não consegue testar
 * bilhões de palpites por segundo.
 *
 * **Este arquivo não pode ser importado pelo `proxy.ts`.** O proxy roda no
 * runtime Edge, onde `node:crypto` não existe; a verificação da sessão lá usa
 * Web Crypto (`dominio/sessao.ts`). Aqui só entra o que roda em Node: o login e
 * a CLI de usuários.
 */

const derivar = promisify(scrypt) as (
  senha: string, sal: Buffer, tamanho: number, opcoes: { N: number; r: number; p: number },
) => Promise<Buffer>

/** Parâmetros gravados junto do hash: mudá-los não invalida as senhas antigas. */
const CUSTO = { N: 16_384, r: 8, p: 1 }
const TAMANHO = 64
const SAL = 16

/** `scrypt$N$r$p$sal$hash`, tudo em hex. Um campo de texto, sem tabela extra. */
export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(SAL)
  const hash = await derivar(senha, sal, TAMANHO, CUSTO)
  return `scrypt$${CUSTO.N}$${CUSTO.r}$${CUSTO.p}$${sal.toString('hex')}$${hash.toString('hex')}`
}

/**
 * Confere a senha contra o hash guardado.
 *
 * Devolve `false` para qualquer coisa estranha — formato desconhecido, hex
 * inválido, tamanho diferente — sem distinguir os casos. A comparação é em
 * tempo constante: comparar com `===` vaza, pelo tempo de resposta, quantos
 * bytes iniciais o palpite acertou.
 */
export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const partes = (guardado ?? '').split('$')
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false

  const [, n, r, p, salHex, hashHex] = partes
  if (!/^[0-9a-f]+$/.test(salHex) || !/^[0-9a-f]+$/.test(hashHex)) return false

  const esperado = Buffer.from(hashHex, 'hex')
  try {
    const obtido = await derivar(
      senha, Buffer.from(salHex, 'hex'), esperado.length,
      { N: Number(n), r: Number(r), p: Number(p) },
    )
    return obtido.length === esperado.length && timingSafeEqual(obtido, esperado)
  } catch {
    return false
  }
}

/**
 * Uma senha para entregar a alguém.
 *
 * Sem `0`/`O` e `1`/`l`: esta senha vai ser lida em voz alta ou copiada de um
 * papel, e o par ambíguo vira chamado de suporte.
 */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

export function senhaSorteada(tamanho = 14): string {
  // O alfabeto tem 55 letras e o byte tem 256 valores: 256 não é múltiplo de 55,
  // então `byte % 55` faria as 36 primeiras letras saírem 25% mais que as outras.
  // Descartar o resto do intervalo custa alguns bytes e tira o viés inteiro.
  const limite = 256 - (256 % ALFABETO.length)
  let saida = ''
  while (saida.length < tamanho) {
    for (const byte of randomBytes(tamanho)) {
      if (byte >= limite) continue
      saida += ALFABETO[byte % ALFABETO.length]
      if (saida.length === tamanho) break
    }
  }
  return saida
}
