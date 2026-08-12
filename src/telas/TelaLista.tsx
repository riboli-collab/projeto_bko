'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ListaDePedidos } from '@/design/secoes/lista-de-pedidos/components'
import { consultarLista } from '@/app/acoes/consultar-lista'
import { FILTROS_VAZIOS, type FiltrosAtivos } from '@/dominio/filtros'
// Só o tipo: `import type` some na compilação e não puxa o banco para o cliente.
import type { DadosDaLista } from '@/consultas/lista'
import type { SituacaoId } from '@/dominio/tipos'

export function TelaLista({ inicial }: { inicial: DadosDaLista }) {
  const router = useRouter()
  const [dados, setDados] = useState(inicial)
  const [filtros, setFiltros] = useState<FiltrosAtivos>(FILTROS_VAZIOS)
  const [modo, setModo] = useState<'por-situacao' | 'por-dias-parados'>('por-situacao')
  const [gruposAbertos, setGruposAbertos] = useState<SituacaoId[] | undefined>(undefined)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, iniciar] = useTransition()

  function recarregar(novos: FiltrosAtivos) {
    // Os filtros mudam na hora; os dados chegam depois. É isso que permite a
    // mensagem de erro manter os filtros na tela em vez de esvaziá-la.
    setFiltros(novos)
    iniciar(async () => {
      const r = await consultarLista(novos)
      if (r.ok) { setDados(r.dados); setErro(null) } else { setErro(r.erro) }
    })
  }

  return (
    <ListaDePedidos
      pedidos={dados.pedidos}
      situacoes={dados.situacoes}
      opcoesDeFiltro={dados.opcoesDeFiltro}
      filtrosAtivos={filtros}
      resumo={dados.resumo}
      modoDeExibicao={modo}
      gruposAbertos={gruposAbertos}
      isLoading={carregando}
      erro={erro}
      onAbrirPedido={(numero) => router.push(`/pedidos/${numero}`)}
      onModoDeExibicaoChange={setModo}
      onAlternarGrupo={(id) => setGruposAbertos((abertos) => {
        // undefined = o componente decide sozinho (abre os que têm estouro).
        // No primeiro clique manual, materializa a decisão dele e inverte só este.
        const base = abertos ?? dados.situacoes
          .filter((s) => dados.pedidos.some(
            (p) => p.situacaoId === s.id && p.estadoDoPrazo === 'estourado'))
          .map((s) => s.id)
        return base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
      })}
      onFiltrosChange={recarregar}
      onLimparFiltros={() => recarregar(FILTROS_VAZIOS)}
      onTentarNovamente={() => recarregar(filtros)}
    />
  )
}
