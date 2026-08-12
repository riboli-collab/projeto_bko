'use server'

import { db } from '@/db/cliente'
import { divergenciasDeCadastro } from '@/db/schema'
import type { DivergenciaDeCadastro } from '@/dominio/divergencias'

export async function registrarDivergencias(
  cnpjCpf: string, divergencias: DivergenciaDeCadastro[], quem: string,
) {
  if (divergencias.length === 0) return { ok: true as const, registradas: 0 }

  await db.insert(divergenciasDeCadastro).values(
    divergencias.map((d) => ({
      cnpjCpf: cnpjCpf.replace(/\D/g, ''),
      campoId: d.campoId,
      valorDaBase: d.valorDaBase,
      valorDigitado: d.valorDigitado,
      registradaPor: quem,
    })),
  )
  return { ok: true as const, registradas: divergencias.length }
}
