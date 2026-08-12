/**
 * O que o cliente paga, e quando.
 *
 * Duas cobranças diferentes saem dos mesmos três campos do formulário:
 *
 * — o **plano** é por linha e por mês, e recorre enquanto o contrato existir;
 * — o **chip** é por chip e cobrado **uma vez só**, na primeira fatura.
 *
 * Somar os dois num "valor do pedido" é o erro que esta função existe para
 * impedir: quem lê o número somado projeta receita mensal com o chip dentro, e
 * a partir do segundo mês a projeção está alta pelo valor de todos os chips.
 */

/** Reais para centavos. Dinheiro não é somado em ponto flutuante. */
const centavos = (n: number) => Math.round(n * 100)

export interface Cobranca {
  qtdLinhas: number
  /** O plano, por linha, por mês. É o número que a trava de preço confere. */
  planoPorLinha: number
  /** O chip, por chip. Zero é válido — chip cortesia acontece. */
  chipPorChip: number
  /** Plano × linhas. Sai em toda fatura, inclusive na primeira. */
  mensal: number
  /** Chip × linhas. Sai **só** na primeira fatura. */
  chipUmaVez: number
  /** Mensal + chip. O que o cliente paga na primeira fatura. */
  primeiraFatura: number
  /**
   * Não há chip a cobrar: a primeira fatura é igual a todas as outras.
   * Vale quando o chip é cortesia e quando o valor ainda não foi digitado.
   */
  semCobrancaDeChip: boolean
}

/**
 * Note que **eSIM não zera o chip por dedução**.
 *
 * A tentação é óbvia — eSIM não tem plástico para cobrar. Mas quem decide se
 * houve custo de ativação é quem vendeu, e o campo 13 é obrigatório justamente
 * para essa declaração existir: zero digitado é cortesia declarada, e é
 * diferente de zero que o sistema inventou. Mesmo princípio da empresa
 * faturadora em DEC-2026-04.
 *
 * Valores ausentes contam como zero para o resumo poder aparecer enquanto a
 * pessoa ainda digita. A validação dos 17 campos é que recusa o envio — aqui
 * ninguém é aprovado, só somado.
 */
export function calcularCobranca(entrada: {
  precoVenda: number | null
  valorDoChip: number | null
  qtdLinhas: number | null
}): Cobranca {
  const numero = (v: number | null | undefined) =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0

  const planoPorLinha = numero(entrada.precoVenda)
  const chipPorChip = numero(entrada.valorDoChip)
  const qtdLinhas = Math.max(0, Math.trunc(numero(entrada.qtdLinhas)))

  const mensalEmCentavos = centavos(planoPorLinha) * qtdLinhas
  const chipEmCentavos = centavos(chipPorChip) * qtdLinhas

  return {
    qtdLinhas,
    planoPorLinha,
    chipPorChip,
    mensal: mensalEmCentavos / 100,
    chipUmaVez: chipEmCentavos / 100,
    primeiraFatura: (mensalEmCentavos + chipEmCentavos) / 100,
    semCobrancaDeChip: chipEmCentavos === 0,
  }
}

/** Há o que somar. Antes disso o resumo não aparece — zero não informa nada. */
export function cobrancaCalculavel(entrada: {
  precoVenda: number | null
  qtdLinhas: number | null
}): boolean {
  return (
    typeof entrada.precoVenda === 'number' && Number.isFinite(entrada.precoVenda) &&
    entrada.precoVenda > 0 &&
    typeof entrada.qtdLinhas === 'number' && Number.isFinite(entrada.qtdLinhas) &&
    entrada.qtdLinhas > 0
  )
}
