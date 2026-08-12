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
  aplicaA: 'cnpj' | 'cpf'
}

/**
 * Os seis documentos, na ordem e com os textos do pacote de design.
 *
 * Conferido campo a campo contra `sections/entrada-do-pedido/sample-data.json`
 * em `testes/unidade/documentos.test.ts`: rótulo e ajuda são o que está nas
 * capturas de tela, e reescrevê-los aqui faria a tela divergir do que a
 * documentação mostra.
 */
export const DOCUMENTOS: readonly Documento[] = [
  {
    id: 'contratoSocial', rotulo: 'Contrato social',
    ajuda: 'Última alteração consolidada, com o objeto social e os sócios.',
    obrigatorio: true, aplicaA: 'cnpj',
  },
  {
    id: 'documentoRepresentante', rotulo: 'Documento do representante legal',
    ajuda: 'RG ou CNH de quem assina pela empresa. O nome tem que bater com o contrato social.',
    obrigatorio: true, aplicaA: 'cnpj',
  },
  {
    id: 'faturaCnpj', rotulo: 'Fatura',
    ajuda: 'Só quando existe — fatura atual da operadora, para conferir titularidade e plano vigente.',
    obrigatorio: false, aplicaA: 'cnpj',
  },
  {
    id: 'documentoPessoal', rotulo: 'Documento pessoal',
    ajuda: 'RG ou CNH do titular, legível e dentro da validade.',
    obrigatorio: true, aplicaA: 'cpf',
  },
  {
    id: 'comprovanteResidencia', rotulo: 'Comprovante de residência',
    ajuda: 'Emitido nos últimos 90 dias, no nome do titular.',
    obrigatorio: true, aplicaA: 'cpf',
  },
  {
    id: 'faturaOuTitularidade', rotulo: 'Fatura ou evidência de titularidade',
    ajuda: 'Fatura da operadora atual ou outro documento que prove que a linha é do titular.',
    obrigatorio: true, aplicaA: 'cpf',
  },
] as const

export function documentosDe(tipoDePessoa: 'PF' | 'PJ'): Documento[] {
  const alvo = tipoDePessoa === 'PJ' ? 'cnpj' : 'cpf'
  return DOCUMENTOS.filter((d) => d.aplicaA === alvo)
}

/** Os obrigatórios do tipo de pessoa que ainda não foram anexados. */
export function faltamDocumentos(
  tipoDePessoa: 'PF' | 'PJ', anexados: DocumentoId[],
): DocumentoId[] {
  return documentosDe(tipoDePessoa)
    .filter((d) => d.obrigatorio && !anexados.includes(d.id))
    .map((d) => d.id)
}

/** Uma frase, para a tela dizer o que falta sem o usuário contar. */
export function motivoDoBloqueio(faltando: DocumentoId[]): string | null {
  if (faltando.length === 0) return null
  const n = faltando.length
  return n === 1
    ? '1 documento obrigatório não foi anexado'
    : `${n} documentos obrigatórios não foram anexados`
}
