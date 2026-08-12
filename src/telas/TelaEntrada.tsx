'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { EntradaDoPedido } from '@/design/secoes/entrada-do-pedido/components'
import { criarPedido, acharDuplicidade } from '@/app/acoes/criar-pedido'
import { buscarClienteAction } from '@/app/acoes/buscar-cliente'
import { responsavelPor } from '@/dominio/roteamento'
import { avaliarPreco, type CustoDoPlano } from '@/dominio/preco'
import type { Operadora } from '@/dominio/tipos'

const ENDERECO_VAZIO = {
  logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', cep: '',
}

/** Enquanto não há seletor de pessoa (Tarefa 22), o autor é fixo e declarado. */
const QUEM = 'Carlos'

const RASCUNHO_VAZIO = {
  cnpjCpf: '', razaoSocial: '', enderecoFiscal: { ...ENDERECO_VAZIO }, contato: '',
  telefone: '', emailAssinatura: '', emailFinanceiro: '',
  qtdLinhas: null, canalDeVenda: null, operadora: null, planoId: null,
  precoVenda: null, valorDoChip: null, empresaFaturadora: null, tipoDeAcao: null,
  tipoDeChip: null, formaDeEntrega: null, enderecoDeEntrega: null,
  dataPortabilidade: null, observacao: '',
}

export function TelaEntrada({ opcoes }: { opcoes: { planos: CustoDoPlano[] } & Record<string, unknown> }) {
  const router = useRouter()
  const [rascunho, setRascunho] = useState<any>(RASCUNHO_VAZIO)
  const [resultadoDaBusca, setResultadoDaBusca] = useState<'nenhum' | 'buscando' | 'encontrado' | 'nao-encontrado'>('nenhum')
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null)
  const [avisoDeDuplicidade, setAviso] = useState<any>(null)
  const [camposFaltantes, setCamposFaltantes] = useState<Record<string, string>>({})
  const [resultadoDoEnvio, setResultado] = useState<any>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, iniciar] = useTransition()

  // Roteamento é derivado da operadora, na hora. Nunca digitado.
  const responsavelPrevisto = rascunho.operadora
    ? responsavelPor(rascunho.operadora as Operadora)
    : null

  const plano = opcoes.planos.find((p) => p.id === rascunho.planoId) ?? null
  const preco = useMemo(
    () => (plano && rascunho.precoVenda ? avaliarPreco({ precoVenda: rascunho.precoVenda, plano }) : null),
    [plano, rascunho.precoVenda],
  )

  function aoMudar(novo: any) {
    // Motoboy e Correios pedem endereço: o objeto precisa existir para os campos
    // existirem. Isto não é deduzir valor — é abrir o formulário certo.
    const precisaEndereco = novo.formaDeEntrega === 'Motoboy' || novo.formaDeEntrega === 'Correios'
    novo = {
      ...novo,
      enderecoDeEntrega: precisaEndereco
        ? (novo.enderecoDeEntrega ?? { ...ENDERECO_VAZIO, recebedor: '' })
        : null,
    }
    // A EMPRESA FATURADORA NUNCA É ESCRITA AQUI. A tentação é preenchê-la a
    // partir da operadora — a relação existe e é estável. Não preencha:
    // DEC-2026-04 v1.1 diz que deduzir apaga a declaração que o BKO confere.
    // Se um dia esta função encostar em `empresaFaturadora`, o critério 3 do
    // PRD falha, e é para falhar.
    setRascunho(novo)

    const doc = String(novo.cnpjCpf ?? '').replace(/\D/g, '')
    const docAnterior = String(rascunho.cnpjCpf ?? '').replace(/\D/g, '')
    if (doc !== docAnterior && (doc.length === 11 || doc.length === 14)) {
      setResultadoDaBusca('buscando')
      iniciar(async () => {
        const c = await buscarClienteAction(doc)
        setClienteEncontrado(c)
        setResultadoDaBusca(c ? 'encontrado' : 'nao-encontrado')
        if (c) setRascunho((r: any) => ({
          ...r, razaoSocial: c.razaoSocial, contato: c.contato,
          emailFinanceiro: c.emailFinanceiro,
        }))
      })
    }

    if (doc.length >= 11 && novo.qtdLinhas > 0) {
      iniciar(async () => setAviso(await acharDuplicidade(doc, novo.qtdLinhas)))
    }
  }

  return (
    <EntradaDoPedido
      modo="criacao"
      rascunho={rascunho}
      opcoes={opcoes as any}
      resultadoDaBusca={resultadoDaBusca}
      clienteEncontrado={clienteEncontrado}
      camposFaltantes={camposFaltantes}
      bloqueioDePreco={preco?.tipo === 'bloqueado' ? preco.bloqueio : null}
      avisoDeDuplicidade={avisoDeDuplicidade}
      responsavelPrevisto={responsavelPrevisto}
      resultadoDoEnvio={resultadoDoEnvio}
      isEnviando={enviando}
      erro={erro}
      onRascunhoChange={aoMudar}
      onIgnorarDuplicidade={() => setAviso(null)}
      onAbrirPedidoExistente={(numero) => router.push(`/pedidos/${numero}`)}
      onEnviar={() => iniciar(async () => {
        // D3: o componente chama o campo de `tipoDeAcao`; o domínio e o banco
        // chamam de `tipo`. A tradução mora aqui, no adaptador — que é a única
        // camada que conhece os dois vocabulários.
        const r = await criarPedido({
          ...rascunho,
          tipo: rascunho.tipoDeAcao,
          // `vendedor` está no modelo do PRD e NÃO existe no formulário
          // desenhado — não é um dos 17 campos. Até haver decisão, ele é quem
          // preencheu: é a única resposta que não inventa nome de vendedor.
          // A Tarefa 22 troca a constante pelo seletor de pessoa.
          vendedor: QUEM,
        })
        if (r.ok) {
          setCamposFaltantes({})
          setResultado({ numero: r.numero, responsavel: r.responsavel,
            situacaoRotulo: 'PEDIDO DO COMERCIAL', prazoRotulo: '4 horas',
            enviadoEm: new Date().toISOString() })
        } else {
          // Todos os erros de uma vez, nunca só o primeiro, e nada do que já
          // foi digitado se perde: o rascunho não é tocado aqui.
          setCamposFaltantes(r.erros)
          setErro(null)
        }
      })}
    />
  )
}
