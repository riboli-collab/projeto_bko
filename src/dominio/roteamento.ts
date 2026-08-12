import type { EmpresaFaturadora, Operadora } from './tipos'

/** DEC-2026-04: a operadora define quem cuida. */
export function responsavelPor(operadora: Operadora): string {
  return operadora === 'Vivo' || operadora === '2BX' ? 'Gabrielle Souza' : 'Hiago Ferreira'
}

/**
 * O gabarito da conferência do BKO — MAN=Vivo · IG=Claro · 2BX=própria.
 *
 * NÃO use para preencher o campo de empresa faturadora do formulário. DEC-2026-04
 * v1.1 é explícita: "se o sistema deduzir o valor, ele apaga justamente a
 * declaração que o BKO precisa conferir". O Comercial digita; isto só compara.
 */
export function empresaSugeridaPelaOperadora(operadora: Operadora): EmpresaFaturadora {
  if (operadora === 'Vivo') return 'MAN'
  if (operadora === '2BX') return '2BX'
  return 'IG'
}
