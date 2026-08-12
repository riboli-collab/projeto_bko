export function formatarNumero(ano: number, sequencial: number): string {
  return `PED-${ano}-${String(sequencial).padStart(4, '0')}`
}
