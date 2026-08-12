import { useMemo, useState } from 'react'
import { Hash, Loader2, Send, TriangleAlert, Undo2 } from 'lucide-react'
import type {
  CampoId,
  CanalDeVenda,
  Documento,
  DocumentoId,
  EmpresaFaturadora,
  Endereco,
  EnderecoDeEntrega,
  EntradaDoPedidoProps,
  FormaDeEntrega,
  Operadora,
  RascunhoDoPedido,
  TipoDeAcao,
  TipoDeChip,
} from '../types'
import { AvisoDeDuplicidade } from './AvisoDeDuplicidade'
import { BlocoDoFormulario, ContadorDosCampos } from './BlocoDoFormulario'
import { BuscaDeCliente } from './BuscaDeCliente'
import { Campo, CampoNumero, CampoSelecao, CampoTexto, GrupoDeEscolha } from './Campos'
import { CamposDeEndereco } from './CamposDeEndereco'
import { Documentos } from './Documentos'
import { ConfirmacaoDoEnvio, ResumoDeErros } from './EstadosDoEnvio'
import { FaixaDeDevolucao } from './FaixaDeDevolucao'
import { TravaDePreco } from './TravaDePreco'
import { classeDoControle, FOCO, MICRO_ROTULO, MONO } from './estilos'
import { digitos, documentoCompleto, formatarTelefone, telefoneCompleto } from './formato'

/** A ordem dos campos na tela. O número aparece no rótulo para casar com a devolução. */
const NUMERO_DO_CAMPO: Record<CampoId, number> = {
  cnpjCpf: 1,
  razaoSocial: 2,
  enderecoFiscal: 3,
  contato: 4,
  telefone: 5,
  emailAssinatura: 6,
  emailFinanceiro: 7,
  qtdLinhas: 8,
  canalDeVenda: 9,
  operadora: 10,
  plano: 11,
  precoVenda: 12,
  valorDoChip: 13,
  empresaFaturadora: 14,
  tipoDeAcao: 15,
  tipoDeChip: 16,
  formaDeEntrega: 17,
}

const ROTULO_DO_CAMPO: Record<CampoId, string> = {
  cnpjCpf: 'CNPJ / CPF',
  razaoSocial: 'Nome do cliente',
  enderecoFiscal: 'Endereço fiscal',
  contato: 'Contato',
  telefone: 'Telefone (WhatsApp)',
  emailAssinatura: 'E-mail de assinatura',
  emailFinanceiro: 'E-mail do financeiro',
  qtdLinhas: 'Quantidade de linhas',
  canalDeVenda: 'Venda',
  operadora: 'Operadora',
  plano: 'Plano',
  precoVenda: 'Valor',
  valorDoChip: 'Valor do chip',
  empresaFaturadora: 'Empresa faturadora',
  tipoDeAcao: 'Tipo de ação',
  tipoDeChip: 'Chip',
  formaDeEntrega: 'Forma de entrega',
}

const CAMPOS_DO_BLOCO: Record<'cliente' | 'pedido' | 'entrega', CampoId[]> = {
  cliente: [
    'cnpjCpf',
    'razaoSocial',
    'enderecoFiscal',
    'contato',
    'telefone',
    'emailAssinatura',
    'emailFinanceiro',
  ],
  pedido: [
    'qtdLinhas',
    'canalDeVenda',
    'operadora',
    'plano',
    'precoVenda',
    'valorDoChip',
    'empresaFaturadora',
    'tipoDeAcao',
  ],
  entrega: ['tipoDeChip', 'formaDeEntrega'],
}

function precisaDeEndereco(forma: FormaDeEntrega | null) {
  return forma === 'Motoboy' || forma === 'Correios'
}

/** Complemento é a única parte opcional de qualquer endereço. */
function enderecoCompleto(endereco: Endereco | null, comRecebedor = false) {
  if (!endereco) return false

  const partes = [
    endereco.logradouro,
    endereco.numero,
    endereco.bairro,
    endereco.cidade,
    endereco.estado,
    endereco.cep,
  ]
  if (comRecebedor) partes.push((endereco as EnderecoDeEntrega).recebedor ?? '')

  return partes.every((parte) => parte.trim().length > 0)
}

/** Uma representação comparável do campo — é o que diz se um item apontado foi mexido. */
function valorDoCampo(rascunho: RascunhoDoPedido, campo: CampoId): string {
  const doEndereco = (endereco: Endereco | null, recebedor = '') =>
    endereco
      ? [
          endereco.logradouro,
          endereco.numero,
          endereco.complemento,
          endereco.bairro,
          endereco.cidade,
          endereco.estado,
          endereco.cep,
          recebedor,
        ].join('|')
      : ''

  switch (campo) {
    case 'cnpjCpf':
      return rascunho.cnpjCpf
    case 'razaoSocial':
      return rascunho.razaoSocial
    case 'enderecoFiscal':
      return doEndereco(rascunho.enderecoFiscal)
    case 'contato':
      return rascunho.contato
    case 'telefone':
      return rascunho.telefone
    case 'emailAssinatura':
      return rascunho.emailAssinatura
    case 'emailFinanceiro':
      return rascunho.emailFinanceiro
    case 'qtdLinhas':
      return String(rascunho.qtdLinhas ?? '')
    case 'canalDeVenda':
      return rascunho.canalDeVenda ?? ''
    case 'operadora':
      return rascunho.operadora ?? ''
    case 'plano':
      return rascunho.planoId ?? ''
    case 'precoVenda':
      return String(rascunho.precoVenda ?? '')
    case 'valorDoChip':
      return String(rascunho.valorDoChip ?? '')
    case 'empresaFaturadora':
      return rascunho.empresaFaturadora ?? ''
    case 'tipoDeAcao':
      return rascunho.tipoDeAcao ?? ''
    case 'tipoDeChip':
      return rascunho.tipoDeChip ?? ''
    case 'formaDeEntrega':
      return [
        rascunho.formaDeEntrega ?? '',
        doEndereco(rascunho.enderecoDeEntrega, rascunho.enderecoDeEntrega?.recebedor ?? ''),
      ].join('||')
  }
}

function campoPreenchido(rascunho: RascunhoDoPedido, campo: CampoId): boolean {
  switch (campo) {
    case 'cnpjCpf':
      return documentoCompleto(rascunho.cnpjCpf)
    case 'telefone':
      return telefoneCompleto(rascunho.telefone)
    case 'enderecoFiscal':
      return enderecoCompleto(rascunho.enderecoFiscal)
    case 'qtdLinhas':
      return (rascunho.qtdLinhas ?? 0) > 0
    case 'precoVenda':
      return (rascunho.precoVenda ?? 0) > 0
    // Chip cortesia acontece: zero é um valor informado, vazio não é.
    case 'valorDoChip':
      return rascunho.valorDoChip !== null
    case 'formaDeEntrega':
      if (!rascunho.formaDeEntrega) return false
      return precisaDeEndereco(rascunho.formaDeEntrega)
        ? enderecoCompleto(rascunho.enderecoDeEntrega, true)
        : true
    default:
      return valorDoCampo(rascunho, campo).trim().length > 0
  }
}

const ENDERECO_VAZIO: Endereco = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
}

const ENDERECO_DE_ENTREGA_VAZIO: EnderecoDeEntrega = { ...ENDERECO_VAZIO, recebedor: '' }

/**
 * O formulário de entrada do pedido.
 *
 * A tela existe para uma coisa só: pedido incompleto não vira pedido. Por isso o
 * contador de campos fica sempre visível e o botão de enviar diz, em texto, por que
 * está desligado — nunca um botão apagado sem explicação.
 *
 * São 17 campos obrigatórios com chip físico e 16 com eSIM: sem chip para entregar,
 * a forma de entrega deixa de existir. Os documentos anexos são uma trava à parte,
 * com a lista mudando conforme o cliente seja CNPJ ou CPF.
 *
 * No modo devolução o mesmo formulário reabre com o motivo do BKO preso a cada item
 * apontado — campo ou documento — e o reenvio só libera quando todos forem mexidos.
 */
export function EntradaDoPedido({
  modo,
  rascunho,
  opcoes,
  numeroDoPedido = null,
  resultadoDaBusca,
  clienteEncontrado = null,
  divergencias = [],
  anexos = [],
  camposFaltantes = {},
  bloqueioDePreco = null,
  excecaoDePreco,
  avisoDeDuplicidade = null,
  devolucao = null,
  responsavelPrevisto = null,
  resultadoDoEnvio = null,
  isEnviando = false,
  erro = null,
  onRascunhoChange,
  onBuscarCliente,
  onRegistrarDivergencia,
  onAnexar,
  onRemoverAnexo,
  onSolicitarExcecao,
  onAbrirPedidoExistente,
  onIgnorarDuplicidade,
  onEnviar,
  onReenviar,
  onIrParaCampo,
}: EntradaDoPedidoProps) {
  const [duplicidadeIgnorada, setDuplicidadeIgnorada] = useState(false)

  // O rascunho como ele chegou. É contra isto que "item apontado foi corrigido" é medido.
  // useState com inicializador preguiçoso, não useRef: os dois congelam o valor da
  // primeira renderização, mas ref lido durante a renderização é leitura proibida —
  // o valor de um ref não é rastreado, então o React não sabe que precisa renderizar
  // de novo quando ele muda. Aqui nunca muda, e o state deixa isso explícito.
  const [inicial] = useState(rascunho)
  const [anexosIniciais] = useState(anexos)

  const alterar = (parcial: Partial<RascunhoDoPedido>) =>
    onRascunhoChange?.({ ...rascunho, ...parcial })

  const eDevolucao = modo === 'devolucao' && devolucao !== null
  const eEsim = rascunho.tipoDeChip === 'eSIM'

  const apontamentoDoCampo = (campo: CampoId) =>
    eDevolucao
      ? (devolucao?.apontamentos.find((item) => item.campoId === campo)?.motivo ?? null)
      : null

  const apontamentosDeDocumento = useMemo(() => {
    const mapa: Partial<Record<DocumentoId, string>> = {}
    if (!eDevolucao) return mapa
    for (const item of devolucao?.apontamentos ?? []) {
      if (item.documentoId) mapa[item.documentoId] = item.motivo
    }
    return mapa
  }, [devolucao, eDevolucao])

  /** No modo devolução, item que passou na conferência não deve chamar atenção. */
  const estadoDe = (campo: CampoId) =>
    eDevolucao && !apontamentoDoCampo(campo) ? ('aceito' as const) : undefined

  // Os documentos exigidos mudam com o tipo de pessoa.
  const tipoDePessoa: 'cnpj' | 'cpf' | null = documentoCompleto(rascunho.cnpjCpf)
    ? digitos(rascunho.cnpjCpf).length === 14
      ? 'cnpj'
      : 'cpf'
    : null

  const documentosExigidos = useMemo<Documento[]>(() => {
    if (tipoDePessoa) return opcoes.documentos.filter((d) => d.aplicaA === tipoDePessoa)

    // Sem tipo de pessoa definido o formulário ainda não sabe o que pedir — mas se o BKO
    // apontou documentos na devolução, eles têm que aparecer mesmo assim. É justamente
    // quando o CNPJ voltou errado que o Comercial precisa ver o que mais foi cobrado.
    const apontados = Object.keys(apontamentosDeDocumento) as DocumentoId[]
    return apontados.length > 0 ? opcoes.documentos.filter((d) => apontados.includes(d.id)) : []
  }, [opcoes.documentos, tipoDePessoa, apontamentosDeDocumento])

  const documentosObrigatorios = documentosExigidos.filter((d) => d.obrigatorio)
  const documentosAnexados = documentosObrigatorios.filter((d) =>
    anexos.some((a) => a.documentoId === d.id)
  )
  const faltamDocumentos = documentosObrigatorios.length - documentosAnexados.length

  // A forma de entrega só conta quando há chip físico para entregar.
  const camposDaEntrega = eEsim
    ? CAMPOS_DO_BLOCO.entrega.filter((campo) => campo !== 'formaDeEntrega')
    : CAMPOS_DO_BLOCO.entrega

  const preenchidosPorBloco = useMemo(
    () => ({
      cliente: CAMPOS_DO_BLOCO.cliente.filter((campo) => campoPreenchido(rascunho, campo)).length,
      pedido: CAMPOS_DO_BLOCO.pedido.filter((campo) => campoPreenchido(rascunho, campo)).length,
      entrega: camposDaEntrega.filter((campo) => campoPreenchido(rascunho, campo)).length,
    }),
    [rascunho, camposDaEntrega]
  )

  const totalDeCampos =
    CAMPOS_DO_BLOCO.cliente.length + CAMPOS_DO_BLOCO.pedido.length + camposDaEntrega.length

  const totalPreenchidos =
    preenchidosPorBloco.cliente + preenchidosPorBloco.pedido + preenchidosPorBloco.entrega

  const faltamCampos = totalDeCampos - totalPreenchidos

  const corrigidos = useMemo(() => {
    if (!devolucao) return 0
    return devolucao.apontamentos.filter((item) => {
      if (item.campoId) {
        return valorDoCampo(inicial, item.campoId) !== valorDoCampo(rascunho, item.campoId)
      }
      if (item.documentoId) {
        const antes = anexosIniciais.find((a) => a.documentoId === item.documentoId)
        const agora = anexos.find((a) => a.documentoId === item.documentoId)
        return agora?.nome !== antes?.nome
      }
      return false
    }).length
  }, [devolucao, rascunho, anexos, inicial, anexosIniciais])

  const faltamCorrigir = devolucao ? devolucao.apontamentos.length - corrigidos : 0

  const bloqueioAtivo = bloqueioDePreco !== null && excecaoDePreco?.status !== 'aprovada'

  const itensFaltantes = useMemo(
    () =>
      (Object.entries(camposFaltantes) as [CampoId, string][])
        .filter(([, mensagem]) => Boolean(mensagem))
        .map(([campoId, mensagem]) => ({
          campoId,
          mensagem,
          rotulo: ROTULO_DO_CAMPO[campoId],
          numero: NUMERO_DO_CAMPO[campoId],
        }))
        .sort((a, b) => a.numero - b.numero),
    [camposFaltantes]
  )

  const planosDaOperadora = useMemo(
    () => opcoes.planos.filter((plano) => plano.operadora === rascunho.operadora),
    [opcoes.planos, rascunho.operadora]
  )

  const irParaCampo = (campo: CampoId) => {
    onIrParaCampo?.(campo)
    const elemento = document.getElementById(`campo-${campo}`)
    elemento?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    elemento?.focus?.()
  }

  const envioTravado =
    isEnviando ||
    bloqueioAtivo ||
    faltamDocumentos > 0 ||
    (eDevolucao ? faltamCorrigir > 0 : faltamCampos > 0)

  const motivoDoEnvio = isEnviando
    ? 'Enviando…'
    : bloqueioAtivo
      ? 'Preço abaixo do custo trava o envio — corrija ou obtenha a exceção'
      : eDevolucao && faltamCorrigir > 0
        ? `${faltamCorrigir} ${faltamCorrigir === 1 ? 'item apontado ainda não foi corrigido' : 'itens apontados ainda não foram corrigidos'}`
        : faltamCampos > 0
          ? `${faltamCampos} ${faltamCampos === 1 ? 'campo obrigatório em branco' : 'campos obrigatórios em branco'}`
          : faltamDocumentos > 0
            ? `${faltamDocumentos} ${faltamDocumentos === 1 ? 'documento obrigatório não foi anexado' : 'documentos obrigatórios não foram anexados'}`
            : eDevolucao
              ? 'Todos os itens apontados foram corrigidos'
              : 'Campos e documentos em ordem'

  if (resultadoDoEnvio) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ConfirmacaoDoEnvio resultado={resultadoDoEnvio} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {eDevolucao ? 'Corrigir pedido devolvido' : 'Novo pedido'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {eDevolucao
              ? 'Corrija os itens apontados pelo BKO e reenvie. A conferência recomeça do zero.'
              : 'Sem todos os campos e documentos, o pedido não é criado. O BKO tem 4 horas para conferir.'}
          </p>

          {/* Campo 1 da lista do Comercial: o número, que o sistema dá sozinho */}
          <p className="mt-2 flex items-center gap-1.5">
            <Hash
              className="h-3.5 w-3.5 shrink-0 text-slate-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className={MICRO_ROTULO}>Número do pedido</span>
            {numeroDoPedido ? (
              <span
                className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100"
                style={{ fontFamily: MONO }}
              >
                {numeroDoPedido}
              </span>
            ) : (
              <span className="text-xs italic text-slate-400 dark:text-slate-500">
                gerado pelo sistema ao enviar
              </span>
            )}
          </p>
        </div>

        <ContadorDosCampos preenchidos={totalPreenchidos} total={totalDeCampos} />
      </header>

      {eDevolucao && devolucao && (
        <FaixaDeDevolucao devolucao={devolucao} corrigidos={corrigidos} />
      )}

      <ResumoDeErros itens={itensFaltantes} onIrParaCampo={irParaCampo} />

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/70 p-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {erro}
        </div>
      )}

      {/* Bloco 1 — Cliente */}
      <BlocoDoFormulario
        titulo="Cliente"
        descricao="Quem compra. O cadastro vem da base pelo CNPJ/CPF."
        preenchidos={preenchidosPorBloco.cliente}
        total={CAMPOS_DO_BLOCO.cliente.length}
      >
        <BuscaDeCliente
          valor={rascunho.cnpjCpf}
          resultado={resultadoDaBusca}
          cliente={clienteEncontrado}
          divergencias={divergencias}
          erro={camposFaltantes.cnpjCpf}
          apontamento={apontamentoDoCampo('cnpjCpf')}
          apontadoPor={devolucao?.devolvidaPor}
          onChange={(valor) => alterar({ cnpjCpf: valor })}
          onBuscar={onBuscarCliente}
          onRegistrarDivergencia={onRegistrarDivergencia}
        />

        <CampoTexto
          id="campo-razaoSocial"
          rotulo={ROTULO_DO_CAMPO.razaoSocial}
          numero={2}
          obrigatorio
          className="sm:col-span-2"
          valor={rascunho.razaoSocial}
          onChange={(valor) => alterar({ razaoSocial: valor })}
          erro={camposFaltantes.razaoSocial}
          apontamento={apontamentoDoCampo('razaoSocial')}
          apontadoPor={devolucao?.devolvidaPor}
          daBase={resultadoDaBusca === 'encontrado'}
          estado={estadoDe('razaoSocial')}
          ajuda="Razão social por extenso, como está no CNPJ. Nome fantasia sozinho não serve."
          placeholder="Razão social por extenso"
        />

        <div className="sm:col-span-2" id="campo-enderecoFiscal">
          <CamposDeEndereco
            endereco={rascunho.enderecoFiscal}
            prefixoId="campo-enderecoFiscal"
            legenda="Endereço fiscal — onde a empresa está registrada"
            numeroDoCampo={NUMERO_DO_CAMPO.enderecoFiscal}
            estado={estadoDe('enderecoFiscal')}
            onChange={(endereco) => alterar({ enderecoFiscal: endereco as Endereco })}
          />
          {apontamentoDoCampo('enderecoFiscal') && (
            <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">
              <span className="font-semibold">{devolucao?.devolvidaPor}: </span>
              {apontamentoDoCampo('enderecoFiscal')}
            </p>
          )}
        </div>

        <CampoTexto
          id="campo-contato"
          rotulo={ROTULO_DO_CAMPO.contato}
          numero={4}
          obrigatorio
          valor={rascunho.contato}
          onChange={(valor) => alterar({ contato: valor })}
          erro={camposFaltantes.contato}
          apontamento={apontamentoDoCampo('contato')}
          apontadoPor={devolucao?.devolvidaPor}
          daBase={resultadoDaBusca === 'encontrado'}
          estado={estadoDe('contato')}
          ajuda="Nome e sobrenome de uma pessoa."
          placeholder="Nome e sobrenome"
        />

        <CampoTexto
          id="campo-telefone"
          rotulo={ROTULO_DO_CAMPO.telefone}
          numero={5}
          obrigatorio
          valor={rascunho.telefone}
          onChange={(valor) => alterar({ telefone: formatarTelefone(valor) })}
          erro={camposFaltantes.telefone}
          apontamento={apontamentoDoCampo('telefone')}
          apontadoPor={devolucao?.devolvidaPor}
          daBase={resultadoDaBusca === 'encontrado'}
          estado={estadoDe('telefone')}
          inputMode="numeric"
          mono
          ajuda="É por onde o cliente é avisado da portabilidade."
          placeholder="(00) 00000-0000"
        />

        <CampoTexto
          id="campo-emailAssinatura"
          rotulo={ROTULO_DO_CAMPO.emailAssinatura}
          numero={6}
          obrigatorio
          valor={rascunho.emailAssinatura}
          onChange={(valor) => alterar({ emailAssinatura: valor })}
          erro={camposFaltantes.emailAssinatura}
          apontamento={apontamentoDoCampo('emailAssinatura')}
          apontadoPor={devolucao?.devolvidaPor}
          daBase={resultadoDaBusca === 'encontrado'}
          estado={estadoDe('emailAssinatura')}
          inputMode="email"
          ajuda="Para onde o contrato vai ser enviado para assinar."
          placeholder="quem.assina@empresa.com.br"
        />

        <CampoTexto
          id="campo-emailFinanceiro"
          rotulo={ROTULO_DO_CAMPO.emailFinanceiro}
          numero={7}
          obrigatorio
          valor={rascunho.emailFinanceiro}
          onChange={(valor) => alterar({ emailFinanceiro: valor })}
          erro={camposFaltantes.emailFinanceiro}
          apontamento={apontamentoDoCampo('emailFinanceiro')}
          apontadoPor={devolucao?.devolvidaPor}
          daBase={resultadoDaBusca === 'encontrado'}
          estado={estadoDe('emailFinanceiro')}
          inputMode="email"
          ajuda="Para onde vai a cobrança. Pode ser o mesmo da assinatura."
          placeholder="financeiro@empresa.com.br"
        />
      </BlocoDoFormulario>

      {avisoDeDuplicidade && !duplicidadeIgnorada && (
        <AvisoDeDuplicidade
          aviso={avisoDeDuplicidade}
          onAbrirPedidoExistente={onAbrirPedidoExistente}
          onIgnorar={() => {
            setDuplicidadeIgnorada(true)
            onIgnorarDuplicidade?.()
          }}
        />
      )}

      {/* Bloco 2 — Pedido */}
      <BlocoDoFormulario
        titulo="Pedido"
        descricao="O que está sendo vendido, por qual canal e por quanto."
        preenchidos={preenchidosPorBloco.pedido}
        total={CAMPOS_DO_BLOCO.pedido.length}
      >
        <CampoNumero
          id="campo-qtdLinhas"
          rotulo={ROTULO_DO_CAMPO.qtdLinhas}
          numero={8}
          obrigatorio
          valor={rascunho.qtdLinhas}
          onChange={(valor) => alterar({ qtdLinhas: valor })}
          erro={camposFaltantes.qtdLinhas}
          apontamento={apontamentoDoCampo('qtdLinhas')}
          apontadoPor={devolucao?.devolvidaPor}
          estado={estadoDe('qtdLinhas')}
          sufixo="linhas"
          placeholder="0"
        />

        <GrupoDeEscolha
          id="campo-canalDeVenda"
          rotulo={ROTULO_DO_CAMPO.canalDeVenda}
          numero={9}
          obrigatorio
          valor={rascunho.canalDeVenda}
          opcoes={opcoes.canaisDeVenda.map((item) => ({ valor: item, rotulo: item }))}
          onChange={(valor) => alterar({ canalDeVenda: valor as CanalDeVenda })}
          erro={camposFaltantes.canalDeVenda}
          apontamento={apontamentoDoCampo('canalDeVenda')}
          apontadoPor={devolucao?.devolvidaPor}
          ajuda="Por onde a venda entrou. Não se confunde com quem fatura."
        />

        <CampoSelecao
          id="campo-operadora"
          rotulo={ROTULO_DO_CAMPO.operadora}
          numero={10}
          obrigatorio
          valor={rascunho.operadora}
          opcoes={opcoes.operadoras.map((item) => ({ valor: item, rotulo: item }))}
          onChange={(valor) => alterar({ operadora: (valor as Operadora) ?? null, planoId: null })}
          erro={camposFaltantes.operadora}
          apontamento={apontamentoDoCampo('operadora')}
          apontadoPor={devolucao?.devolvidaPor}
          estado={estadoDe('operadora')}
          ajuda={
            responsavelPrevisto
              ? `É a operadora que decide o dono: vai para ${responsavelPrevisto}.`
              : 'É este campo que decide para quem o pedido vai.'
          }
        />

        <CampoSelecao
          id="campo-plano"
          rotulo={ROTULO_DO_CAMPO.plano}
          numero={11}
          obrigatorio
          valor={rascunho.planoId}
          opcoes={planosDaOperadora.map((plano) => ({ valor: plano.id, rotulo: plano.nome }))}
          onChange={(valor) => alterar({ planoId: valor })}
          disabled={!rascunho.operadora}
          erro={camposFaltantes.plano}
          apontamento={apontamentoDoCampo('plano')}
          apontadoPor={devolucao?.devolvidaPor}
          estado={estadoDe('plano')}
          placeholder={rascunho.operadora ? 'Selecione o plano' : 'Escolha a operadora primeiro'}
          ajuda="O nome do plano, não a franquia nem o valor."
        />

        <div className="sm:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoNumero
              id="campo-precoVenda"
              rotulo={ROTULO_DO_CAMPO.precoVenda}
              numero={12}
              obrigatorio
              valor={rascunho.precoVenda}
              onChange={(valor) => alterar({ precoVenda: valor })}
              erro={camposFaltantes.precoVenda}
              apontamento={apontamentoDoCampo('precoVenda')}
              apontadoPor={devolucao?.devolvidaPor}
              estado={bloqueioAtivo ? 'bloqueado' : estadoDe('precoVenda')}
              prefixo="R$"
              passo={0.01}
              placeholder="0,00"
              ajuda="Por linha, por mês. Maior que zero."
            />

            <CampoNumero
              id="campo-valorDoChip"
              rotulo={ROTULO_DO_CAMPO.valorDoChip}
              numero={13}
              obrigatorio
              valor={rascunho.valorDoChip}
              onChange={(valor) => alterar({ valorDoChip: valor })}
              erro={camposFaltantes.valorDoChip}
              apontamento={apontamentoDoCampo('valorDoChip')}
              apontadoPor={devolucao?.devolvidaPor}
              estado={estadoDe('valorDoChip')}
              prefixo="R$"
              passo={0.01}
              placeholder="0,00"
              ajuda="Por chip, cobrança única. Zero vale — chip cortesia acontece."
            />
          </div>

          {bloqueioDePreco && (
            <TravaDePreco
              bloqueio={bloqueioDePreco}
              excecao={excecaoDePreco}
              onSolicitarExcecao={onSolicitarExcecao}
            />
          )}
        </div>

        <GrupoDeEscolha
          id="campo-empresaFaturadora"
          rotulo={ROTULO_DO_CAMPO.empresaFaturadora}
          numero={14}
          obrigatorio
          valor={rascunho.empresaFaturadora}
          opcoes={opcoes.empresasFaturadoras.map((item) => ({ valor: item, rotulo: item }))}
          onChange={(valor) => alterar({ empresaFaturadora: valor as EmpresaFaturadora })}
          erro={camposFaltantes.empresaFaturadora}
          apontamento={apontamentoDoCampo('empresaFaturadora')}
          apontadoPor={devolucao?.devolvidaPor}
          ajuda="Escrita pelo Comercial. Não se deduz pela operadora nem pelo cliente."
        />

        <GrupoDeEscolha
          id="campo-tipoDeAcao"
          rotulo={ROTULO_DO_CAMPO.tipoDeAcao}
          numero={15}
          obrigatorio
          valor={rascunho.tipoDeAcao}
          opcoes={opcoes.tiposDeAcao.map((item) => ({ valor: item, rotulo: item }))}
          onChange={(valor) =>
            alterar({
              tipoDeAcao: valor as TipoDeAcao,
              dataPortabilidade: valor === 'Portabilidade' ? rascunho.dataPortabilidade : null,
            })
          }
          erro={camposFaltantes.tipoDeAcao}
          apontamento={apontamentoDoCampo('tipoDeAcao')}
          apontadoPor={devolucao?.devolvidaPor}
        />

        {rascunho.tipoDeAcao === 'Portabilidade' && (
          <Campo
            id="campo-dataPortabilidade"
            rotulo="Data de portabilidade"
            obrigatorio
            ajuda="Na véspera, o pedido avisa que o cliente precisa responder o SMS."
          >
            <input
              id="campo-dataPortabilidade"
              type="date"
              value={rascunho.dataPortabilidade ?? ''}
              onChange={(evento) => alterar({ dataPortabilidade: evento.target.value || null })}
              className={`${classeDoControle('normal')} tabular-nums`}
              style={{ fontFamily: MONO }}
            />
          </Campo>
        )}

        <Campo
          id="campo-observacao"
          rotulo="Observação"
          ajuda="Texto livre. Não substitui campo obrigatório."
          className="sm:col-span-2"
        >
          <textarea
            id="campo-observacao"
            rows={3}
            value={rascunho.observacao}
            onChange={(evento) => alterar({ observacao: evento.target.value })}
            placeholder="Alguma coisa que o BKO precise saber?"
            className={`${classeDoControle('normal')} resize-y`}
          />
        </Campo>
      </BlocoDoFormulario>

      {/* Bloco 3 — Chip e entrega */}
      <BlocoDoFormulario
        titulo="Chip e entrega"
        descricao="Como o chip existe e, quando físico, como chega ao cliente."
        preenchidos={preenchidosPorBloco.entrega}
        total={camposDaEntrega.length}
      >
        <GrupoDeEscolha
          id="campo-tipoDeChip"
          rotulo={ROTULO_DO_CAMPO.tipoDeChip}
          numero={16}
          obrigatorio
          className="sm:col-span-2"
          valor={rascunho.tipoDeChip}
          opcoes={opcoes.tiposDeChip.map((item) => ({ valor: item, rotulo: item }))}
          onChange={(valor) => {
            const chip = valor as TipoDeChip
            // eSIM não tem o que entregar: a forma de entrega e o endereço saem juntos.
            alterar({
              tipoDeChip: chip,
              formaDeEntrega: chip === 'eSIM' ? null : rascunho.formaDeEntrega,
              enderecoDeEntrega: chip === 'eSIM' ? null : rascunho.enderecoDeEntrega,
            })
          }}
          erro={camposFaltantes.tipoDeChip}
          apontamento={apontamentoDoCampo('tipoDeChip')}
          apontadoPor={devolucao?.devolvidaPor}
        />

        {eEsim ? (
          <p className="text-xs text-slate-500 sm:col-span-2 dark:text-slate-400">
            eSIM é entregue por e-mail, no endereço de assinatura. Não pede forma de entrega nem
            endereço.
          </p>
        ) : (
          <>
            <GrupoDeEscolha
              id="campo-formaDeEntrega"
              rotulo={ROTULO_DO_CAMPO.formaDeEntrega}
              numero={17}
              obrigatorio
              className="sm:col-span-2"
              valor={rascunho.formaDeEntrega}
              opcoes={opcoes.formasDeEntrega.map((item) => ({ valor: item, rotulo: item }))}
              onChange={(valor) => {
                const forma = valor as FormaDeEntrega
                alterar({
                  formaDeEntrega: forma,
                  enderecoDeEntrega: precisaDeEndereco(forma)
                    ? (rascunho.enderecoDeEntrega ?? ENDERECO_DE_ENTREGA_VAZIO)
                    : null,
                })
              }}
              erro={camposFaltantes.formaDeEntrega}
              apontamento={apontamentoDoCampo('formaDeEntrega')}
              apontadoPor={devolucao?.devolvidaPor}
            />

            {precisaDeEndereco(rascunho.formaDeEntrega) && (
              <CamposDeEndereco
                endereco={rascunho.enderecoDeEntrega ?? ENDERECO_DE_ENTREGA_VAZIO}
                prefixoId="campo-enderecoDeEntrega"
                legenda={`Endereço de entrega — obrigatório em ${(rascunho.formaDeEntrega ?? '').toLowerCase()}`}
                comRecebedor
                onChange={(endereco) =>
                  alterar({ enderecoDeEntrega: endereco as EnderecoDeEntrega })
                }
              />
            )}
          </>
        )}
      </BlocoDoFormulario>

      {/* Bloco 4 — Documentos */}
      <BlocoDoFormulario
        titulo="Documentos"
        descricao={
          tipoDePessoa === 'cpf'
            ? 'Pessoa física: documento pessoal, comprovante de residência e titularidade.'
            : tipoDePessoa === 'cnpj'
              ? 'Empresa: contrato social e documento de quem assina. A fatura, quando existe.'
              : 'A lista depende de o cliente ser CNPJ ou CPF.'
        }
        preenchidos={documentosAnexados.length}
        total={documentosObrigatorios.length}
      >
        <Documentos
          documentos={documentosExigidos}
          anexos={anexos}
          apontamentos={apontamentosDeDocumento}
          apontadoPor={devolucao?.devolvidaPor}
          aguardandoDocumento={tipoDePessoa === null && documentosExigidos.length === 0}
          onAnexar={onAnexar}
          onRemoverAnexo={onRemoverAnexo}
        />
      </BlocoDoFormulario>

      {/* A barra que diz por que o envio está desligado */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <p
          className={`text-xs ${
            envioTravado && !isEnviando
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {motivoDoEnvio}
        </p>

        <button
          type="button"
          disabled={envioTravado}
          onClick={eDevolucao ? onReenviar : onEnviar}
          className={`flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-blue-600 dark:hover:bg-blue-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${FOCO}`}
        >
          {isEnviando ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
          ) : eDevolucao ? (
            <Undo2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          )}
          {eDevolucao ? 'Reenviar pedido' : 'Criar pedido'}
        </button>
      </div>
    </div>
  )
}
