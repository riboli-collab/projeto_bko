/** Os 17 status. Os 14 primeiros são o caminho normal, na ordem. */
export type SituacaoId =
  | 'PEDIDO_DO_COMERCIAL'
  | 'AGUARDANDO_CONFECCAO'
  | 'CONTRATO_ENVIADO'
  | 'CONTRATO_ASSINADO'
  | 'ENVIADO_PARA_OPERADORA'
  | 'CONTRATO_DA_OPERADORA'
  | 'AGUARDANDO_ASSINATURA_OPERADORA'
  | 'CONTRATO_ASSINADO_INPUT'
  | 'FATURADO_NA_OPERADORA'
  | 'ENVIO_SMS'
  | 'AGUARDANDO_PORTABILIDADE'
  | 'PRONTO_PRA_ENTREGA'
  | 'ENTREGUE'
  | 'PEDIDO_FINALIZADO'
  | 'DEVOLVIDO'
  | 'PARADO'
  | 'CANCELADO'

export type EstadoDoPrazo = 'estourado' | 'atencao' | 'em-dia' | 'pausado' | 'encerrado'
export type Operadora = 'Vivo' | 'Claro' | '2BX' | 'TIM'

/** Digitada pelo Comercial, nunca deduzida da operadora nem do cliente (DEC-2026-04). */
export type EmpresaFaturadora = 'IG' | 'MAN' | '2BX'

export type TipoDePedido = 'Linha nova' | 'Portabilidade' | 'Troca'
/** D3: o mesmo tipo com o nome que os componentes da Entrada importam. */
export type TipoDeAcao = TipoDePedido

export type TipoDeChip = 'Físico' | 'eSIM'

/** D2: sem `eSIM`. eSIM é tipo de chip; aqui é nulo. */
export type FormaDeEntrega = 'Retirada no escritório' | 'Motoboy' | 'Correios'

/** Por onde a venda entrou. Não se confunde com a empresa que fatura. */
export type CanalDeVenda = 'IG' | 'MAN' | '2BX' | 'Operadora direto'

/**
 * Endereço com a forma que a tela coleta — sete campos, não uma linha de texto.
 *
 * Definido aqui, e não em `validacao-do-pedido.ts`, porque o schema do banco
 * precisa dele antes de existir validação: guardar o endereço como `text` faz o
 * componente `CamposDeEndereco` ler `.logradouro` de uma string e a tela quebra
 * na primeira tecla. CEP, cidade, estado e o nome de quem recebe o chip
 * simplesmente não chegariam ao banco.
 */
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
