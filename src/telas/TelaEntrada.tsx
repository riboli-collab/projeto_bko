'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { EntradaDoPedido } from '@/design/secoes/entrada-do-pedido/components'
import { criarPedido, acharDuplicidade } from '@/app/acoes/criar-pedido'
import { buscarClienteAction } from '@/app/acoes/buscar-cliente'
import { responsavelPor } from '@/dominio/roteamento'
import { avaliarPreco, type CustoDoPlano } from '@/dominio/preco'
import { validarPedido, type CampoId } from '@/dominio/validacao-do-pedido'
import { compararComABase, valoresDaBase, type DivergenciaDeCadastro } from '@/dominio/divergencias'
import { registrarDivergencias } from '@/app/acoes/divergencias'
import { anexarDocumento, removerAnexo } from '@/app/acoes/documentos'
import type { DocumentoId } from '@/dominio/documentos'
import type { Operadora } from '@/dominio/tipos'

const ENDERECO_VAZIO = {
  logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', cep: '',
}

const CAMPOS_DO_ENDERECO = ['logradouro', 'numero', 'bairro', 'cidade', 'estado', 'cep']

/** Endereço com os seis campos obrigatórios digitados. Complemento não conta. */
function enderecoTemConteudo(e: Record<string, string> | null): boolean {
  return !!e && CAMPOS_DO_ENDERECO.every((k) => String(e[k] ?? '').trim() !== '')
}

/**
 * O campo tem conteúdo — não necessariamente conteúdo certo.
 *
 * Em branco é **falta**, e a tela já a conta: o contador do bloco e o motivo do
 * botão dizem quantos faltam. Preenchido e errado é **erro**, e aí a mensagem
 * precisa aparecer na hora — o componente trava o envio por conta própria
 * quando o formato é inválido, então esperar o servidor responder seria esperar
 * um envio que nunca acontece, e o critério 2 do PRD nunca fecharia.
 */
function temConteudo(r: Record<string, any>, campo: CampoId): boolean {
  switch (campo) {
    case 'enderecoFiscal':
      return enderecoTemConteudo(r.enderecoFiscal)
    case 'formaDeEntrega':
      if (!r.formaDeEntrega) return false
      // Só cobra o endereço de entrega depois de digitado inteiro — senão a
      // tela reclama de cidade e CEP enquanto o dedo ainda está no logradouro.
      if (r.formaDeEntrega === 'Retirada no escritório') return true
      return enderecoTemConteudo(r.enderecoDeEntrega)
        && String(r.enderecoDeEntrega?.recebedor ?? '').trim() !== ''
    case 'plano':
      return Boolean(r.planoId)
    case 'qtdLinhas':
    case 'precoVenda':
    case 'valorDoChip':
      return r[campo] !== null && r[campo] !== undefined
    default:
      return String(r[campo] ?? '').trim() !== ''
  }
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
  // Um identificador por formulário aberto. Os anexos ficam pendurados nele até
  // o pedido nascer — é isso que permite anexar antes de existir número.
  const [rascunhoId] = useState(() => crypto.randomUUID())
  const [anexos, setAnexos] = useState<
    { documentoId: DocumentoId; nome: string; tamanho: number; anexadoEm: string }[]
  >([])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, iniciar] = useTransition()

  // Roteamento é derivado da operadora, na hora. Nunca digitado.
  const responsavelPrevisto = rascunho.operadora
    ? responsavelPor(rascunho.operadora as Operadora)
    : null

  // A mesma função valida nos dois lados: aqui para a tela nomear o erro na
  // hora, e no Server Action para valer. O servidor continua sendo a autoridade
  // — isto aqui é o que a pessoa lê enquanto digita.
  const errosDeFormato = useMemo(() => {
    const todos = validarPedido({ ...rascunho, tipo: rascunho.tipoDeAcao })
    return Object.fromEntries(
      Object.entries(todos).filter(([campo]) => temConteudo(rascunho, campo as CampoId)),
    ) as Record<string, string>
  }, [rascunho])

  // Recalculada a cada tecla, contra o cadastro que a busca trouxe.
  const divergencias: DivergenciaDeCadastro[] = useMemo(
    () => (clienteEncontrado ? compararComABase(rascunho, clienteEncontrado) : []),
    [rascunho, clienteEncontrado],
  )

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
      resultadoDaBusca={
        clienteEncontrado && divergencias.length > 0 ? 'divergente' : resultadoDaBusca
      }
      clienteEncontrado={clienteEncontrado}
      divergencias={divergencias}
      onRegistrarDivergencia={(lista) => {
        // O botão diz "registrar **e seguir com o da base**". As duas coisas:
        // a divergência vira registro para alguém decidir depois, e o rascunho
        // passa a valer o que a base guarda — senão a tela mostraria o digitado
        // e o pedido nasceria com ele, que é justamente o que a regra recusa.
        setRascunho((r: any) => ({ ...r, ...valoresDaBase(lista) }))
        iniciar(async () => { await registrarDivergencias(rascunho.cnpjCpf, lista, QUEM) })
      }}
      // O que o servidor respondeu vence o que a tela calculou: ele viu o banco.
      camposFaltantes={{ ...errosDeFormato, ...camposFaltantes }}
      bloqueioDePreco={preco?.tipo === 'bloqueado' ? preco.bloqueio : null}
      anexos={anexos}
      onAnexar={(documentoId, arquivo) => iniciar(async () => {
        const dados = new FormData()
        dados.set('rascunhoId', rascunhoId)
        dados.set('documentoId', documentoId)
        dados.set('quem', QUEM)
        dados.set('arquivo', arquivo)
        const r = await anexarDocumento(dados)
        if (r.ok) {
          setAnexos((atual) => [...atual.filter((a) => a.documentoId !== documentoId), r.anexo])
          setErro(null)
        } else {
          setErro(r.motivo)
        }
      })}
      onRemoverAnexo={(documentoId) => iniciar(async () => {
        await removerAnexo(rascunhoId, documentoId)
        setAnexos((atual) => atual.filter((a) => a.documentoId !== documentoId))
      })}
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
          rascunhoId,
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
