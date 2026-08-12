/**
 * As datas que os componentes de design esperam receber.
 *
 * O pacote não usa ISO: `dataEntrada` é `2026-07-28` e `quando` do histórico é
 * `2026-08-03 14:22` — conferido em `sections/status-do-pedido/sample-data.json`.
 * Mandar ISO faz `formatarDataHora` devolver `12T19:31:01.413Z/08/2026` na tela,
 * sem erro nenhum no console: o defeito só aparece para quem lê.
 *
 * Formatado em hora local, e não UTC: o pedido anda no fuso de quem trabalha.
 */
const doisDigitos = (n: number) => String(n).padStart(2, '0')

export function dataDoDesign(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`
}

export function dataHoraDoDesign(d: Date): string {
  return `${dataDoDesign(d)} ${horaDoDesign(d)}`
}

/** Só a hora, `08:14` — é o que o resumo do painel mostra em "atualizado às". */
export function horaDoDesign(d: Date): string {
  return `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
}

/**
 * Dia e mês de uma data que veio como `YYYY-MM-DD`, sem passar por `Date`.
 *
 * `new Date('2026-08-13')` é meia-noite **UTC**; em Chapecó isso é 21h do dia
 * 12, e a portabilidade de amanhã aparece como sendo de hoje. O bug não dá
 * erro: só mostra a data errada para quem vai ligar para o cliente.
 */
export function diaMesDoDesign(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}
