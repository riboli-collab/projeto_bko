import type { Endereco } from './tipos'

/**
 * O endereço em uma linha, para as telas que o exibem como texto.
 *
 * O formulário coleta sete campos; o Status do Pedido mostra um. A conversão
 * mora aqui, e não numa interpolação espalhada por adaptador — endereço sem
 * cidade não pode virar "Rua X, 120, , SC".
 */
export function formatarEndereco(e: Endereco | null): string {
  if (!e) return ''

  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ')
  const complemento = e.complemento?.trim()
  const cidade = [e.cidade, e.estado].filter(Boolean).join(' - ')
  const cep = e.cep ? `CEP ${e.cep}` : ''

  return [rua, complemento, e.bairro, cidade, cep].filter(Boolean).join(' · ')
}
