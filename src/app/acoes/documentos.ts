'use server'

import fs from 'node:fs/promises'
import path from 'node:path'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { anexos } from '@/db/schema'
import type { DocumentoId } from '@/dominio/documentos'
import { exigirUsuario } from './sessao'

/**
 * Fora de `public/`: nada aqui é servido por URL estática.
 *
 * Configurável porque em produção o disco do contêiner é efêmero — sem apontar
 * para um volume montado, contrato social e RG desaparecem no primeiro
 * redeploy, e o banco fica com linhas apontando para arquivo que não existe.
 */
const RAIZ = process.env.ARMAZENAMENTO_DIR ?? path.join(process.cwd(), 'armazenamento')

const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png']
const TAMANHO_MAXIMO = 10 * 1024 * 1024

/** Sem caminho, sem `..`, sem caractere que o sistema de arquivos leia como comando. */
function nomeSeguro(nome: string): string {
  return path.basename(nome).replace(/[^\w.\- ]+/g, '_').slice(0, 120)
}

export async function anexarDocumento(dados: FormData) {
  // Quem anexou vem da sessão. Era um campo do FormData, que o navegador monta.
  const { nome: quem } = await exigirUsuario()
  const rascunhoId = String(dados.get('rascunhoId') ?? '')
  const documentoId = String(dados.get('documentoId') ?? '') as DocumentoId
  const arquivo = dados.get('arquivo')

  if (!/^[a-f0-9-]{36}$/.test(rascunhoId)) {
    return { ok: false as const, motivo: 'Rascunho inválido.' }
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false as const, motivo: 'Nenhum arquivo foi enviado.' }
  }
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return { ok: false as const, motivo: 'Anexe PDF, JPG ou PNG — foi isso que a operadora aceita.' }
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { ok: false as const, motivo: 'O arquivo passa de 10 MB. Reduza a digitalização e tente de novo.' }
  }

  const pasta = path.join(RAIZ, 'rascunhos', rascunhoId)
  await fs.mkdir(pasta, { recursive: true })

  const nome = nomeSeguro(arquivo.name)
  const destino = path.join(pasta, `${documentoId}-${nome}`)
  await fs.writeFile(destino, Buffer.from(await arquivo.arrayBuffer()))

  // Um arquivo por documento: reanexar substitui, não empilha.
  const anterior = await db.select().from(anexos)
    .where(and(eq(anexos.rascunhoId, rascunhoId), eq(anexos.documentoId, documentoId)))
  for (const a of anterior) {
    // Só apaga o arquivo antigo se o novo não ocupou o mesmo caminho — nome
    // igual reanexado sobrescreve, e apagar depois deixaria a linha órfã.
    if (a.caminho !== destino) await fs.rm(a.caminho, { force: true })
    await db.delete(anexos).where(eq(anexos.id, a.id))
  }

  const [gravado] = await db.insert(anexos).values({
    rascunhoId, documentoId, nome, tamanho: arquivo.size,
    tipoMime: arquivo.type, caminho: destino, anexadoPor: quem,
  }).returning()

  // Nome do arquivo pode conter o nome do cliente. Não vai para log.
  return {
    ok: true as const,
    anexo: {
      id: gravado.id, documentoId, nome, tamanho: gravado.tamanho,
      anexadoEm: gravado.anexadoEm.toISOString(),
    },
  }
}

export async function removerAnexo(rascunhoId: string, documentoId: DocumentoId) {
  const encontrados = await db.select().from(anexos)
    .where(and(eq(anexos.rascunhoId, rascunhoId), eq(anexos.documentoId, documentoId)))
  for (const a of encontrados) {
    await fs.rm(a.caminho, { force: true })
    await db.delete(anexos).where(eq(anexos.id, a.id))
  }
  return { ok: true as const }
}

export async function listarAnexos(rascunhoId: string) {
  const lista = await db.select().from(anexos).where(eq(anexos.rascunhoId, rascunhoId))
  return lista.map((a) => ({
    id: a.id,
    documentoId: a.documentoId as DocumentoId,
    nome: a.nome, tamanho: a.tamanho, anexadoEm: a.anexadoEm.toISOString(),
  }))
}

/**
 * Move os arquivos do rascunho para a pasta do pedido e amarra as linhas ao número.
 * Roda dentro da criação, depois de o pedido existir.
 */
export async function amarrarAnexosAoPedido(rascunhoId: string, numero: string) {
  const lista = await db.select().from(anexos).where(eq(anexos.rascunhoId, rascunhoId))
  if (lista.length === 0) return

  const pasta = path.join(RAIZ, 'pedidos', numero)
  await fs.mkdir(pasta, { recursive: true })

  for (const a of lista) {
    const destino = path.join(pasta, path.basename(a.caminho))
    await fs.rename(a.caminho, destino)
    await db.update(anexos)
      .set({ numeroDoPedido: numero, caminho: destino })
      .where(eq(anexos.id, a.id))
  }
  await fs.rm(path.join(RAIZ, 'rascunhos', rascunhoId), { recursive: true, force: true })
}
