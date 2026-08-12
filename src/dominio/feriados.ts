/**
 * Feriados que o relógio da esteira desconta.
 *
 * TRÊS PROCEDÊNCIAS, e só a primeira é fato:
 *
 * 1. FERIADO NACIONAL — lei federal. Entra automaticamente.
 * 2. PONTO FACULTATIVO — Carnaval e Corpus Christi NÃO são feriado nacional.
 *    Se o BKO fecha neles é decisão da empresa, e ninguém respondeu. Estão
 *    calculados e prontos, mas FORA do conjunto aplicado.
 * 3. MUNICIPAL E ESTADUAL — não sabemos nem em que município o BKO opera.
 *    A lista está vazia de propósito: vazia e explícita é honesto, adivinhada
 *    não é.
 *
 * Isto é a metade da regra P2 do PRD que dá para fechar com fato. A outra
 * metade — horário de expediente, e se as 4 horas do primeiro status contam
 * fora dele — continua `A CONFIRMAR`.
 */

const iso = (d: Date) => d.toISOString().slice(0, 10)
const utc = (ano: number, mes: number, dia: number) => new Date(Date.UTC(ano, mes - 1, dia))

/** Algoritmo gregoriano anônimo (Meeus/Jones/Butcher). */
export function domingoDePascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return utc(ano, mes, dia)
}

const somarDias = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

/** Feriados nacionais por lei federal. Nove fixos mais a Sexta-feira Santa. */
export function feriadosNacionais(ano: number): string[] {
  const fixos: [number, number][] = [
    [1, 1],    // Confraternização Universal
    [21, 4],   // Tiradentes
    [1, 5],    // Dia do Trabalho
    [7, 9],    // Independência
    [12, 10],  // Nossa Senhora Aparecida
    [2, 11],   // Finados
    [15, 11],  // Proclamação da República
    [20, 11],  // Consciência Negra — Lei 14.759/2023
    [25, 12],  // Natal
  ]
  const sextaSanta = iso(somarDias(domingoDePascoa(ano), -2))
  return [...fixos.map(([d, m]) => iso(utc(ano, m, d))), sextaSanta].sort()
}

/**
 * Ponto facultativo federal — NÃO é feriado.
 * Aplicar ou não é decisão do BKO. Enquanto não houver resposta, não se aplica:
 * transformar facultativo em feriado esconderia a pergunta dentro do cálculo.
 */
export function pontosFacultativosNacionais(ano: number): string[] {
  const pascoa = domingoDePascoa(ano)
  return [
    iso(somarDias(pascoa, -48)),  // segunda de Carnaval
    iso(somarDias(pascoa, -47)),  // terça de Carnaval
    iso(somarDias(pascoa, 60)),   // Corpus Christi
  ].sort()
}

/** `A CONFIRMAR` — em que município o BKO opera e quais feriados locais valem. */
export const FERIADOS_LOCAIS: readonly string[] = []

const ANOS_COBERTOS = [2026, 2027, 2028]

export const FERIADOS_DO_BKO: ReadonlySet<string> = new Set([
  ...ANOS_COBERTOS.flatMap(feriadosNacionais),
  ...FERIADOS_LOCAIS,
])

/** Compara pela data LOCAL, não pela UTC: o pedido anda no fuso de quem trabalha. */
export function ehFeriado(data: Date): boolean {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return FERIADOS_DO_BKO.has(`${ano}-${mes}-${dia}`)
}

/** Sai do silêncio: em 2029 o calendário acaba, e alguém precisa saber antes. */
export function calendarioCobre(ano: number): boolean {
  return ANOS_COBERTOS.includes(ano)
}
