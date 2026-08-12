/** Só os dígitos. CNPJ tem 14, CPF tem 11 — é assim que a SOP manda contar. */
export function digitos(texto: string) {
  return texto.replace(/\D/g, '')
}

export function formatarDocumento(texto: string) {
  const numeros = digitos(texto).slice(0, 14)

  if (numeros.length <= 11) {
    return numeros
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** true quando o documento fechou a contagem: 11 dígitos (CPF) ou 14 (CNPJ). */
export function documentoCompleto(texto: string) {
  const total = digitos(texto).length
  return total === 11 || total === 14
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Tamanho de arquivo em bytes para "864 KB" ou "2,4 MB". */
export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

/** Telefone brasileiro: (51) 99812-4470. Aceita fixo de 10 dígitos também. */
export function formatarTelefone(texto: string) {
  const numeros = digitos(texto).slice(0, 11)
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  }
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
}

/** true quando o telefone tem DDD e número completo: 10 ou 11 dígitos. */
export function telefoneCompleto(texto: string) {
  const total = digitos(texto).length
  return total === 10 || total === 11
}

/**
 * Data no formato "AAAA-MM-DD" para "DD/MM/AAAA".
 * Feito na mão de propósito: `new Date('2026-07-24')` é lido como UTC e volta um dia
 * atrás em fuso negativo, que é o nosso.
 */
export function formatarData(iso: string) {
  const partes = iso.split('-')
  if (partes.length !== 3) return iso

  const [ano, mes, dia] = partes
  if (!ano || !mes || !dia) return iso

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
}
