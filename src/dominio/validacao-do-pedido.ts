import type {
  Operadora, EmpresaFaturadora, CanalDeVenda, TipoDePedido, TipoDeChip, FormaDeEntrega,
  Endereco, EnderecoDeEntrega,
} from './tipos'

/**
 * Os 17 campos obrigatórios, com os identificadores do pacote de design.
 *
 * Duas condições não têm identificador próprio e por isso são reportadas no campo
 * que as causa: endereço de entrega aparece em `formaDeEntrega` (é ela que o exige)
 * e data de portabilidade aparece em `tipoDeAcao` (é ele que a exige). O componente
 * só sabe destacar estes 17 — inventar um décimo oitavo faria a mensagem cair no
 * vazio, longe do campo que a resolve.
 */
export type CampoId =
  | 'cnpjCpf' | 'razaoSocial' | 'enderecoFiscal' | 'contato'
  | 'telefone' | 'emailAssinatura' | 'emailFinanceiro'
  | 'qtdLinhas' | 'canalDeVenda' | 'operadora' | 'plano'
  | 'precoVenda' | 'valorDoChip' | 'empresaFaturadora' | 'tipoDeAcao'
  | 'tipoDeChip' | 'formaDeEntrega'

export interface PedidoParaValidar {
  cnpjCpf: string
  razaoSocial: string
  enderecoFiscal: Endereco
  contato: string
  telefone: string
  emailAssinatura: string
  emailFinanceiro: string
  qtdLinhas: number
  canalDeVenda: CanalDeVenda
  operadora: Operadora
  planoId: string
  precoVenda: number
  valorDoChip: number
  empresaFaturadora: EmpresaFaturadora
  tipo: TipoDePedido
  tipoDeChip: TipoDeChip
  formaDeEntrega: FormaDeEntrega | null
  enderecoDeEntrega: EnderecoDeEntrega | null
  dataPortabilidade: string | null
}

const digitos = (s: string) => (s ?? '').replace(/\D/g, '')
const vazio = (s: string) => (s ?? '').trim() === ''

const OPERADORAS: Operadora[] = ['Vivo', 'Claro', '2BX', 'TIM']
const CANAIS: CanalDeVenda[] = ['IG', 'MAN', '2BX', 'Operadora direto']
const EMPRESAS: EmpresaFaturadora[] = ['IG', 'MAN', '2BX']
const TIPOS: TipoDePedido[] = ['Linha nova', 'Portabilidade', 'Troca']
const CHIPS: TipoDeChip[] = ['Físico', 'eSIM']
const ENTREGAS: FormaDeEntrega[] = ['Retirada no escritório', 'Motoboy', 'Correios']
/** As duas formas que exigem endereço e recebedor. Retirada não exige. */
const ENTREGAS_COM_ENDERECO: FormaDeEntrega[] = ['Motoboy', 'Correios']

/**
 * Um contato é completo quando tem nome e sobrenome.
 *
 * A base traz 1.108 dos 1.126 com só o primeiro nome. A regra é a mesma para o que
 * veio da base e para o que foi digitado — senão a tela recusa o que ela mesma
 * preencheu, e a equipe aprende a digitar "SILVA SILVA" para passar (R9 do PRD).
 */
export function contatoEstaCompleto(contato: string): boolean {
  return (contato ?? '').trim().split(/\s+/).filter(Boolean).length >= 2
}

/** Formato de e-mail, sem tentar validar o domínio: parte@parte.parte. */
function ehEmail(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((valor ?? '').trim())
}

/** Lista em português: "sem cidade", "sem cidade e sem CEP". */
function lista(itens: string[]): string {
  if (itens.length <= 1) return itens.join('')
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

function validarEndereco(e: Endereco | null, rotulo: string): string | null {
  if (!e) return `${rotulo} não foi preenchido`

  const faltando: string[] = []
  if (vazio(e.logradouro)) faltando.push('logradouro')
  if (vazio(e.numero)) faltando.push('número')
  if (vazio(e.bairro)) faltando.push('bairro')
  if (vazio(e.cidade)) faltando.push('cidade')
  if (vazio(e.estado)) faltando.push('estado')
  if (vazio(e.cep)) faltando.push('CEP')
  // Complemento não entra: apartamento e sala nem sempre existem.
  // O "sem" se repete em cada item de propósito: "sem cidade e sem CEP" nomeia
  // duas faltas; "sem cidade e CEP" se lê como uma só.
  if (faltando.length) return `${rotulo} ${lista(faltando.map((f) => `sem ${f}`))}`

  if (e.estado.trim().length !== 2) return 'Estado é a sigla de duas letras — SC, PR, RS'
  const cep = digitos(e.cep)
  if (cep.length !== 8) return `CEP tem 8 dígitos — você digitou ${cep.length}`
  return null
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Devolve **todos** os erros, nunca só o primeiro: o critério 2 do PRD exige três
 * erros de formato aparecendo de uma vez. Objeto vazio significa pedido válido.
 *
 * `hoje` é injetado para o teste não depender do relógio da máquina.
 */
export function validarPedido(
  p: PedidoParaValidar, hoje: Date = new Date(),
): Partial<Record<CampoId, string>> {
  const erros: Partial<Record<CampoId, string>> = {}

  // — Cliente —
  const doc = digitos(p.cnpjCpf)
  if (doc.length !== 11 && doc.length !== 14) {
    erros.cnpjCpf = `CNPJ tem 14 dígitos e CPF tem 11 — você digitou ${doc.length}`
  }
  if (vazio(p.razaoSocial)) {
    erros.razaoSocial = doc.length === 11 ? 'Nome do titular em branco' : 'Razão social em branco'
  }
  const erroFiscal = validarEndereco(p.enderecoFiscal, 'Endereço fiscal')
  if (erroFiscal) erros.enderecoFiscal = erroFiscal

  if (vazio(p.contato)) {
    erros.contato = 'Contato em branco — é quem o BKO procura quando o pedido trava'
  } else if (!contatoEstaCompleto(p.contato)) {
    erros.contato = `Contato precisa de nome e sobrenome — o cadastro trouxe só "${p.contato.trim()}"`
  }

  const tel = digitos(p.telefone)
  if (tel.length !== 10 && tel.length !== 11) {
    erros.telefone = `Telefone com DDD tem 10 ou 11 dígitos — você digitou ${tel.length}`
  }
  if (!ehEmail(p.emailAssinatura)) {
    erros.emailAssinatura = 'E-mail de assinatura em formato inválido — é para onde vai o contrato'
  }
  if (!ehEmail(p.emailFinanceiro)) {
    erros.emailFinanceiro = 'E-mail financeiro em formato inválido — é para onde vai a cobrança'
  }

  // — Pedido —
  if (!Number.isFinite(p.qtdLinhas) || p.qtdLinhas <= 0) {
    erros.qtdLinhas = 'Quantidade de linhas precisa ser maior que zero'
  } else if (!Number.isInteger(p.qtdLinhas)) {
    erros.qtdLinhas = 'Quantidade de linhas é um número inteiro de linhas'
  }
  if (!CANAIS.includes(p.canalDeVenda)) {
    erros.canalDeVenda = 'Canal de venda em branco — é por onde a venda entrou'
  }
  if (!OPERADORAS.includes(p.operadora)) {
    erros.operadora = 'Operadora em branco — é ela que decide o responsável pelo pedido'
  }
  if (vazio(p.planoId)) {
    erros.plano = 'Plano em branco — é contra o custo dele que o preço é conferido'
  }
  if (!Number.isFinite(p.precoVenda) || p.precoVenda <= 0) {
    erros.precoVenda = 'Preço de venda precisa ser maior que zero'
  }
  if (!Number.isFinite(p.valorDoChip) || p.valorDoChip < 0) {
    erros.valorDoChip = 'Valor do chip não pode ser negativo. Zero é válido — chip cortesia acontece'
  }
  // RN7/RN8: nunca deduzida da operadora. Em branco não passa, e fica em branco.
  if (!EMPRESAS.includes(p.empresaFaturadora)) {
    erros.empresaFaturadora = 'Empresa faturadora em branco não passa, e não se preenche por dedução'
  }
  if (!TIPOS.includes(p.tipo)) {
    erros.tipoDeAcao = 'Tipo do pedido em branco — linha nova, portabilidade ou troca'
  } else if (p.tipo === 'Portabilidade') {
    if (!p.dataPortabilidade) {
      erros.tipoDeAcao = 'Portabilidade exige a data agendada'
    } else {
      const [ano, mes, dia] = p.dataPortabilidade.split('-').map(Number)
      const agendada = new Date(ano, (mes ?? 1) - 1, dia ?? 1)
      const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      if (agendada < inicioDeHoje) {
        erros.tipoDeAcao = `A data de portabilidade já passou — ${formatarData(p.dataPortabilidade)}`
      }
    }
  }

  // — Chip e entrega —
  if (!CHIPS.includes(p.tipoDeChip)) {
    erros.tipoDeChip = 'Tipo de chip em branco — físico ou eSIM'
  } else if (p.tipoDeChip === 'eSIM') {
    // D2: eSIM não tem o que entregar. O campo 17 desaparece, e são 16.
    if (p.formaDeEntrega !== null) {
      erros.formaDeEntrega = 'eSIM não tem o que entregar — deixe a forma de entrega em branco'
    }
  } else if (!p.formaDeEntrega || !ENTREGAS.includes(p.formaDeEntrega)) {
    erros.formaDeEntrega = 'Chip físico exige forma de entrega'
  } else if (ENTREGAS_COM_ENDERECO.includes(p.formaDeEntrega)) {
    if (!p.enderecoDeEntrega || vazio(p.enderecoDeEntrega.recebedor)) {
      erros.formaDeEntrega =
        `${p.formaDeEntrega} exige endereço de entrega e o nome de quem recebe`
    } else {
      const erroEntrega = validarEndereco(p.enderecoDeEntrega, 'Endereço de entrega')
      if (erroEntrega) erros.formaDeEntrega = erroEntrega
    }
  }

  return erros
}
