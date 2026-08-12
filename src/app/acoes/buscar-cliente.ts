'use server'
import { buscarCliente } from '@/consultas/clientes'
export async function buscarClienteAction(cnpjCpf: string) {
  return buscarCliente(cnpjCpf)
}
