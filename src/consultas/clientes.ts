import { eq, sql } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { clientes } from '@/db/schema'

export async function buscarCliente(cnpjCpf: string) {
  const doc = cnpjCpf.replace(/\D/g, '')
  if (doc.length !== 11 && doc.length !== 14) return null
  const [c] = await db.select().from(clientes).where(eq(clientes.cnpjCpf, doc))
  return c ?? null
}

/**
 * Os pares de caracteres do `translate` do Postgres, e por que não é `unaccent`.
 *
 * `unaccent` é uma extensão: instalá-la exige superusuário, e o Postgres
 * gerenciado do Railway não dá esse acesso. `translate` é função nativa,
 * funciona em qualquer instalação, e faz exatamente o que se precisa aqui.
 *
 * As duas metades cobrem maiúscula e minúscula porque `lower()` depende do
 * locale do banco: em locale C ele não rebaixa "Á". Traduzindo antes, o
 * resultado é o mesmo em qualquer configuração.
 */
const COM_ACENTO = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ'
const SEM_ACENTO = 'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn'

/** A mesma normalização do lado do JavaScript, para os dois lados combinarem. */
function semAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** `%` e `_` digitados são texto, não curinga — senão "100%" varre a base inteira. */
function escaparLike(valor: string): string {
  return valor.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** Menos que isto varre a base e não ajuda ninguém a escolher. */
const MINIMO_DE_CARACTERES = 3

export interface ClienteDaBusca {
  cnpjCpf: string
  razaoSocial: string
}

/**
 * Procura cliente por razão social ou por documento.
 *
 * Devolve **só** nome e documento — o cadastro inteiro vem depois, quando
 * alguém escolhe um da lista. São dois motivos: oito cadastros completos
 * viajariam telefone e e-mail de gente que não tem nada a ver com o pedido, e
 * o caminho de "cliente escolhido" continua sendo um só, o mesmo do CNPJ
 * digitado, com a mesma comparação de divergência.
 */
export async function procurarClientes(
  termo: string,
  limite = 8,
): Promise<ClienteDaBusca[]> {
  const bruto = (termo ?? '').trim()
  if (bruto === '') return []

  const colunas = { cnpjCpf: clientes.cnpjCpf, razaoSocial: clientes.razaoSocial }
  const digitos = bruto.replace(/\D/g, '')

  // Só dígitos e pontuação de documento: é CNPJ/CPF sendo digitado, não nome.
  if (/^[\d.\-/\s]+$/.test(bruto)) {
    if (digitos.length < MINIMO_DE_CARACTERES) return []
    return db
      .select(colunas).from(clientes)
      .where(sql`${clientes.cnpjCpf} LIKE ${`${digitos}%`}`)
      .orderBy(clientes.razaoSocial)
      .limit(limite)
  }

  const alvo = semAcento(bruto)
  if (alvo.length < MINIMO_DE_CARACTERES) return []

  const comparavel = sql`translate(${clientes.razaoSocial}, ${COM_ACENTO}, ${SEM_ACENTO})`
  const escapado = escaparLike(alvo)

  return db
    .select(colunas).from(clientes)
    .where(sql`${comparavel} ILIKE ${`%${escapado}%`}`)
    // Quem começa com o que foi digitado vem primeiro: procurando por "alfa",
    // "Alfa Telecom" interessa mais que "Consultoria Alfa".
    .orderBy(sql`CASE WHEN ${comparavel} ILIKE ${`${escapado}%`} THEN 0 ELSE 1 END, ${clientes.razaoSocial}`)
    .limit(limite)
}
