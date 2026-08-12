import type { Endereco } from './tipos'

/** O cadastro como a base guarda. É o que `buscarCliente` devolve. */
export interface CadastroDoCliente {
  cnpjCpf: string
  razaoSocial: string
  contato: string
  telefone: string
  emailAssinatura: string
  emailFinanceiro: string
  enderecoFiscal: Endereco | null
}

/** Os seis campos do formulário que existem no cadastro. Plano e preço não são cadastro. */
export type CampoDeCadastro =
  | 'razaoSocial' | 'contato' | 'telefone'
  | 'emailAssinatura' | 'emailFinanceiro' | 'enderecoFiscal'

export interface Preenchimento {
  valores: Partial<Record<CampoDeCadastro | 'cnpjCpf', unknown>>
  /** Quais campos vieram da base. É o que a tela usa para dizer a verdade. */
  vindosDaBase: CampoDeCadastro[]
}

const TEXTOS: Exclude<CampoDeCadastro, 'enderecoFiscal'>[] = [
  'razaoSocial', 'contato', 'telefone', 'emailAssinatura', 'emailFinanceiro',
]

const CAMPOS_DO_ENDERECO: (keyof Endereco)[] = [
  'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'cep',
]

/** Endereço que a base tem de fato: os seis obrigatórios digitados. */
function enderecoUtil(e: Endereco | null | undefined): boolean {
  return !!e && CAMPOS_DO_ENDERECO.every((k) => String(e[k] ?? '').trim() !== '')
}

/**
 * O que o rascunho recebe quando o cliente é achado na base.
 *
 * **Vazio na base não é valor.** Telefone, e-mail de assinatura e endereço
 * fiscal não existem na origem (R10 do PRD) — 1.108 dos 1.126 cadastros vieram
 * só com nome e e-mail financeiro. Copiar a string vazia por cima apagaria
 * justamente o que o Comercial acabou de digitar para completar o cadastro.
 *
 * Por isso o retorno traz `vindosDaBase`: a tela precisa saber a diferença
 * entre "veio do cadastro" e "continua sendo seu para preencher", e o
 * componente do design pinta os dois de modos diferentes (`estado: 'daBase'`).
 */
export function preencherComOCadastro(cadastro: CadastroDoCliente): Preenchimento {
  const valores: Preenchimento['valores'] = { cnpjCpf: cadastro.cnpjCpf }
  const vindosDaBase: CampoDeCadastro[] = []

  for (const campo of TEXTOS) {
    const valor = String(cadastro[campo] ?? '').trim()
    if (valor === '') continue
    valores[campo] = valor
    vindosDaBase.push(campo)
  }

  if (enderecoUtil(cadastro.enderecoFiscal)) {
    valores.enderecoFiscal = cadastro.enderecoFiscal
    vindosDaBase.push('enderecoFiscal')
  }

  return { valores, vindosDaBase }
}
