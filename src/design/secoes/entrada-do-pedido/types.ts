/**
 * Contratos de dados da seção Entrada do pedido.
 * Estes tipos descrevem o que os componentes esperam receber por props —
 * não são o modelo de dados da implementação.
 */

/**
 * Os campos obrigatórios do formulário, na ordem em que aparecem.
 *
 * São 17 quando o chip é físico e 16 quando é eSIM — sem chip para entregar,
 * a forma de entrega deixa de existir.
 */
export type CampoId =
  // Cliente
  | 'cnpjCpf'
  | 'razaoSocial'
  | 'enderecoFiscal'
  | 'contato'
  | 'telefone'
  | 'emailAssinatura'
  | 'emailFinanceiro'
  // Pedido
  | 'qtdLinhas'
  | 'canalDeVenda'
  | 'operadora'
  | 'plano'
  | 'precoVenda'
  | 'valorDoChip'
  | 'empresaFaturadora'
  | 'tipoDeAcao'
  // Chip e entrega
  | 'tipoDeChip'
  | 'formaDeEntrega'

/** Os quatro blocos do formulário. */
export type BlocoId = 'cliente' | 'pedido' | 'entrega' | 'documentos'

export type Operadora = 'Vivo' | 'Claro' | '2BX' | 'TIM'

/**
 * Por onde a venda entrou. IG, MAN e 2BX são as empresas do grupo; `Operadora direto`
 * é a venda que não passa por nenhuma delas.
 * Não se confunde com a empresa que fatura — o campo 14 pode divergir deste.
 */
export type CanalDeVenda = 'IG' | 'MAN' | '2BX' | 'Operadora direto'

/** Quem emite a nota. Digitada pelo Comercial, nunca deduzida da operadora nem do cliente. */
export type EmpresaFaturadora = 'IG' | 'MAN' | '2BX'

export type TipoDeAcao = 'Linha nova' | 'Portabilidade' | 'Troca'

export type TipoDeChip = 'Físico' | 'eSIM'

/** Só existe quando o chip é físico. eSIM chega por e-mail, sem entrega a combinar. */
export type FormaDeEntrega = 'Retirada no escritório' | 'Motoboy' | 'Correios'

/** O que a busca por CNPJ/CPF devolveu. `nenhum` é o estado antes de haver dígitos suficientes. */
export type ResultadoDaBusca = 'nenhum' | 'buscando' | 'encontrado' | 'nao-encontrado' | 'divergente'

/** `criacao` é o pedido nascendo. `devolucao` é o mesmo formulário reaberto com os apontamentos do BKO. */
export type ModoDoFormulario = 'criacao' | 'devolucao'

export interface Endereco {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface EnderecoDeEntrega extends Endereco {
  /** Nome de quem recebe. Obrigatório em motoboy e Correios. */
  recebedor: string
}

/** O cadastro como está na base — a fonte da verdade quando há divergência. */
export interface ClienteCadastro {
  cnpjCpf: string
  razaoSocial: string
  enderecoFiscal: Endereco
  contato: string
  telefone: string
  emailAssinatura: string
  emailFinanceiro: string
}

/** Um campo em que o valor digitado difere do que a base guarda. A base é o que vale. */
export interface DivergenciaDeCadastro {
  campoId: CampoId
  rotulo: string
  valorDigitado: string
  valorDaBase: string
}

export interface Plano {
  id: string
  nome: string
  operadora: Operadora
  /** Custo mensal por linha. É contra ele que o preço de venda é comparado. */
  custoPorLinha: number
}

/**
 * Os documentos que o pedido precisa trazer anexados.
 *
 * A lista muda com o tipo de pessoa: CNPJ pede contrato social e documento do
 * representante legal; CPF pede documento pessoal, comprovante de residência e
 * fatura ou evidência de titularidade.
 */
export type DocumentoId =
  | 'contratoSocial'
  | 'documentoRepresentante'
  | 'faturaCnpj'
  | 'documentoPessoal'
  | 'comprovanteResidencia'
  | 'faturaOuTitularidade'

export interface Documento {
  id: DocumentoId
  rotulo: string
  /** O que exatamente anexar, dito em uma linha. */
  ajuda: string
  /** false apenas na fatura do CNPJ — ela só é pedida quando existe. */
  obrigatorio: boolean
  /** Qual tipo de pessoa pede este documento. */
  aplicaA: 'cnpj' | 'cpf'
}

export interface ArquivoAnexado {
  documentoId: DocumentoId
  nome: string
  /** Em bytes. A tela mostra "1,2 MB". */
  tamanho: number
  anexadoEm: string
}

export interface RascunhoDoPedido {
  // Cliente
  cnpjCpf: string
  razaoSocial: string
  enderecoFiscal: Endereco
  contato: string
  /** Telefone com WhatsApp. É por onde o cliente é avisado da portabilidade. */
  telefone: string
  /** Para onde vai o contrato assinar. */
  emailAssinatura: string
  /** Para onde vai a cobrança. Pode ser o mesmo da assinatura. */
  emailFinanceiro: string

  // Pedido
  qtdLinhas: number | null
  canalDeVenda: CanalDeVenda | null
  operadora: Operadora | null
  planoId: string | null
  /** Em reais, por linha, por mês. Maior que zero. */
  precoVenda: number | null
  /** Em reais, por chip, cobrança única. Zero é válido — chip cortesia acontece. */
  valorDoChip: number | null
  empresaFaturadora: EmpresaFaturadora | null
  tipoDeAcao: TipoDeAcao | null

  // Chip e entrega
  tipoDeChip: TipoDeChip | null
  /** Nulo quando o chip é eSIM — não há o que entregar. */
  formaDeEntrega: FormaDeEntrega | null
  /** Só em motoboy e Correios. Nulo nas demais formas de entrega. */
  enderecoDeEntrega: EnderecoDeEntrega | null

  /** Só em portabilidade. */
  dataPortabilidade: string | null
  observacao: string
}

/** Pedido em aberto que casa com o CNPJ e a quantidade de linhas do rascunho. Decisão, não erro. */
export interface AvisoDeDuplicidade {
  numero: string
  razaoSocial: string
  situacaoRotulo: string
  qtdLinhas: number
  diasParados: number
  dataEntrada: string
}

/** Preço abaixo do custo. Enquanto existir e não houver exceção aprovada, o envio fica bloqueado. */
export interface BloqueioDePreco {
  custoPorLinha: number
  precoInformado: number
  /** Quanto falta por linha para o preço alcançar o custo. Sempre positivo. */
  diferenca: number
  planoNome: string
}

export type StatusDaExcecao = 'nao-solicitada' | 'aguardando' | 'aprovada' | 'recusada'

export interface ExcecaoDePreco {
  status: StatusDaExcecao
  justificativa: string
  /** Preenchidos quando o Supervisor decide. */
  decididaPor: string | null
  decididaEm: string | null
}

/**
 * Um item que o BKO apontou na devolução.
 * Exatamente um dos dois é preenchido: o campo do formulário ou o documento anexo.
 */
export interface ApontamentoDeDevolucao {
  campoId: CampoId | null
  documentoId: DocumentoId | null
  motivo: string
}

export interface Devolucao {
  numero: string
  devolvidaPor: string
  devolvidaEm: string
  /** O texto do Modelo 2, como o Comercial recebeu. */
  mensagem: string
  apontamentos: ApontamentoDeDevolucao[]
  /** Quantas vezes este pedido já foi devolvido. A partir da segunda, o Supervisor entra em cópia. */
  vez: number
}

export interface OpcoesDoFormulario {
  operadoras: Operadora[]
  canaisDeVenda: CanalDeVenda[]
  empresasFaturadoras: EmpresaFaturadora[]
  tiposDeAcao: TipoDeAcao[]
  tiposDeChip: TipoDeChip[]
  formasDeEntrega: FormaDeEntrega[]
  planos: Plano[]
  /** O catálogo dos documentos, com os de CNPJ e os de CPF juntos. A tela filtra pelo documento digitado. */
  documentos: Documento[]
}

/** O que o pedido ganha sozinho ao ser enviado. Nada disso é digitado. */
export interface ResultadoDoEnvio {
  numero: string
  /** Atribuído pela operadora: Vivo e 2BX vão para Gabrielle, as demais para Hiago. */
  responsavel: string
  situacaoRotulo: string
  prazoRotulo: string
  enviadoEm: string
}

export interface EntradaDoPedidoProps {
  modo: ModoDoFormulario
  rascunho: RascunhoDoPedido
  opcoes: OpcoesDoFormulario

  /**
   * O número do pedido. Nulo na criação — ele é gerado pelo sistema no envio,
   * e a tela diz isso em vez de mostrar um campo vazio.
   */
  numeroDoPedido?: string | null

  /** Resultado da busca do CNPJ/CPF na base de clientes. */
  resultadoDaBusca: ResultadoDaBusca
  /** O cadastro da base quando encontrado. Nulo quando é cliente novo. */
  clienteEncontrado?: ClienteCadastro | null
  /** Campos em que o digitado diverge da base. Vazio quando não há divergência. */
  divergencias?: DivergenciaDeCadastro[]

  /** Os arquivos já anexados, um por documento. */
  anexos?: ArquivoAnexado[]

  /** Campos obrigatórios ainda vazios ou inválidos, com a mensagem. Só aparece depois de tentar enviar. */
  camposFaltantes?: Partial<Record<CampoId, string>>
  /** Nulo quando o preço está acima do custo ou ainda não foi informado. */
  bloqueioDePreco?: BloqueioDePreco | null
  excecaoDePreco?: ExcecaoDePreco
  /** Nulo quando não há pedido em aberto que case com CNPJ e quantidade de linhas. */
  avisoDeDuplicidade?: AvisoDeDuplicidade | null
  /** Presente apenas no modo devolução. */
  devolucao?: Devolucao | null

  /** Responsável já calculado pela operadora escolhida. Nulo enquanto não houver operadora. */
  responsavelPrevisto?: string | null
  /** Preenchido depois do envio bem-sucedido. */
  resultadoDoEnvio?: ResultadoDoEnvio | null

  isEnviando?: boolean
  erro?: string | null

  /** Qualquer alteração de campo do formulário. */
  onRascunhoChange?: (rascunho: RascunhoDoPedido) => void
  /** Dispara a busca na base quando o CNPJ/CPF fecha a contagem de dígitos. */
  onBuscarCliente?: (cnpjCpf: string) => void
  /** Registra a divergência junto do pedido e mantém o valor da base. */
  onRegistrarDivergencia?: (divergencias: DivergenciaDeCadastro[]) => void
  /** Anexa um arquivo a um dos documentos pedidos. */
  onAnexar?: (documentoId: DocumentoId, arquivo: File) => void
  /** Remove o arquivo anexado a um documento. */
  onRemoverAnexo?: (documentoId: DocumentoId) => void
  /** Pede a exceção de preço ao Supervisor, com a justificativa escrita. */
  onSolicitarExcecao?: (justificativa: string) => void
  /** Abre o pedido já existente apontado pelo aviso de duplicidade. */
  onAbrirPedidoExistente?: (numero: string) => void
  /** Segue com o novo pedido apesar do aviso de duplicidade. */
  onIgnorarDuplicidade?: () => void
  /** Cria o pedido. Só habilitado com todos os campos e documentos obrigatórios em ordem. */
  onEnviar?: () => void
  /** Reenvia o pedido devolvido depois de corrigir os itens apontados. */
  onReenviar?: () => void
  /** Leva o foco ao campo, a partir do resumo de erros. */
  onIrParaCampo?: (campoId: CampoId) => void
}
