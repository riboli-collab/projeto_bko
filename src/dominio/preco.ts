import type { Operadora } from './tipos'

/**
 * De onde veio o custo. É a informação que separa uma conferência de um palpite.
 *
 * `contrato` foi verificado contra a tabela da operadora (18 combinações, 6.880
 * linhas). `lancado` é o número digitado na planilha e nunca conferido (67
 * combinações, 2.763 linhas) — e em 12 casos já se sabe que ele diverge do
 * contrato. `ausente` é não ter custo (1 combinação, 3 linhas).
 */
export type OrigemDoCusto = 'contrato' | 'lancado' | 'ausente'

export interface CustoDoPlano {
  id: string
  nome: string
  operadora: Operadora
  /** Nulo apenas quando a origem é `ausente`. */
  custoPorLinha: number | null
  origem: OrigemDoCusto
}

export interface BloqueioDePreco {
  custoPorLinha: number
  precoInformado: number
  diferenca: number
  planoNome: string
  /** Viaja até a tela: quem decide a exceção precisa saber contra o que decide. */
  origem: Exclude<OrigemDoCusto, 'ausente'>
}

export type ResultadoDoPreco =
  | { tipo: 'ok'; origem: Exclude<OrigemDoCusto, 'ausente'> }
  | { tipo: 'bloqueado'; bloqueio: BloqueioDePreco }
  /** Sem custo cadastrado: a trava não pode conferir. Silêncio não é aprovação. */
  | { tipo: 'sem-custo'; planoNome: string }

const centavos = (n: number) => Math.round(n * 100)

export function avaliarPreco(a: { precoVenda: number; plano: CustoDoPlano }): ResultadoDoPreco {
  if (a.plano.origem === 'ausente' || a.plano.custoPorLinha === null) {
    return { tipo: 'sem-custo', planoNome: a.plano.nome }
  }
  const origem = a.plano.origem
  const custo = centavos(a.plano.custoPorLinha)
  const preco = centavos(a.precoVenda)
  if (preco >= custo) return { tipo: 'ok', origem }

  return {
    tipo: 'bloqueado',
    bloqueio: {
      custoPorLinha: a.plano.custoPorLinha,
      precoInformado: a.precoVenda,
      diferenca: (custo - preco) / 100,
      planoNome: a.plano.nome,
      origem,
    },
  }
}
