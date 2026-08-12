'use server'

import { listarPedidos, type FiltrosAtivos, type DadosDaLista } from '@/consultas/lista'

/**
 * A tela é um Client Component e não fala com o banco. Filtrar refaz a consulta
 * no servidor — a contagem dos chips depende do conjunto inteiro, não da página
 * que está na tela, e filtrar no cliente daria número errado assim que a fila
 * passasse de uma página.
 */
export async function consultarLista(
  filtros: FiltrosAtivos,
): Promise<{ ok: true; dados: DadosDaLista } | { ok: false; erro: string }> {
  try {
    return { ok: true, dados: await listarPedidos(filtros) }
  } catch {
    // Sem detalhe técnico na mensagem: ela vai para a tela, e a tela é do BKO.
    return { ok: false, erro: 'Não foi possível carregar a fila. Tente de novo.' }
  }
}
