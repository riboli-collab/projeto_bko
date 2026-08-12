'use server'
import { buscarCliente, procurarClientes } from '@/consultas/clientes'

export async function buscarClienteAction(cnpjCpf: string) {
  return buscarCliente(cnpjCpf)
}

export async function procurarClientesAction(termo: string) {
  return procurarClientes(termo)
}
