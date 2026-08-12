import fs from 'node:fs'
import type { Operadora } from '@/dominio/tipos'
import type { OrigemDoCusto } from '@/dominio/preco'

export interface NovoPlano {
  id: string
  nome: string
  operadora: Operadora
  custoPorLinha: number | null
  origem: OrigemDoCusto
}

const OPERADORAS: Record<string, Operadora> = {
  VIVO: 'Vivo', CLARO: 'Claro', '2BX': '2BX', TIM: 'TIM',
}

const idDe = (nome: string, operadora: string) =>
  `${operadora}-${nome}`.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/**
 * dados/_catalogo-planos.csv, gerado por scripts/catalogo-planos.py.
 * Colunas usadas: plano_canonico, operadora, custo_contratado, custo_lancado_mediana.
 *
 * A PROCEDÊNCIA é o que importa aqui, não só o número:
 *   - custo_contratado preenchido  -> origem 'contrato' (18 combinações)
 *   - só custo_lancado_mediana     -> origem 'lancado'  (67 combinações)
 *   - nenhum dos dois              -> origem 'ausente'  (1 combinação)
 *
 * Custo ausente vira NULL — nunca zero. Zero passaria por "de graça" na trava.
 * E o contratado sempre ganha do lançado: em 12 combinações eles divergem, a
 * maior delas em 3.112 linhas.
 */
export function lerPlanos(caminhoCsv: string): NovoPlano[] {
  const texto = fs.readFileSync(caminhoCsv, 'utf8').replace(/^﻿/, '')
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== '')
  const cabecalho = linhas[0].split(';').map((c) => c.trim())

  const iNome = cabecalho.indexOf('plano_canonico')
  const iOper = cabecalho.indexOf('operadora')
  const iContrato = cabecalho.indexOf('custo_contratado')
  const iLancado = cabecalho.indexOf('custo_lancado_mediana')

  return linhas.slice(1).map((linha) => {
    const c = linha.split(';')
    const nome = (c[iNome] ?? '').trim()
    const bruta = (c[iOper] ?? '').trim().toUpperCase()
    const contrato = (c[iContrato] ?? '').trim()
    const lancado = (c[iLancado] ?? '').trim()

    const origem: OrigemDoCusto =
      contrato !== '' ? 'contrato' : lancado !== '' ? 'lancado' : 'ausente'
    const custoPorLinha =
      origem === 'contrato' ? Number(contrato)
      : origem === 'lancado' ? Number(lancado)
      : null

    return {
      id: idDe(nome, bruta || 'sem-operadora'),
      nome,
      operadora: OPERADORAS[bruta] ?? '2BX',
      custoPorLinha,
      origem,
    }
  })
}
