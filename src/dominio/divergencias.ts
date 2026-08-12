import type { CampoId } from './validacao-do-pedido'

export interface DivergenciaDeCadastro {
  campoId: CampoId
  rotulo: string
  valorDigitado: string
  valorDaBase: string
}

/** Só os campos de cadastro que a base guarda. Plano e preço não são cadastro. */
const COMPARAVEIS: { campoId: CampoId; rotulo: string }[] = [
  { campoId: 'razaoSocial', rotulo: 'Razão social' },
  { campoId: 'contato', rotulo: 'Contato' },
  { campoId: 'telefone', rotulo: 'Telefone' },
  { campoId: 'emailAssinatura', rotulo: 'E-mail de assinatura' },
  { campoId: 'emailFinanceiro', rotulo: 'E-mail financeiro' },
]

type Cadastro = Record<string, string>

/** Sem acento, sem caixa, sem espaço dobrado. "Comércio  LTDA" == "comercio ltda". */
function normalizar(valor: string): string {
  return (valor ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * O que o Comercial digitou contra o que a base guarda.
 *
 * Três coisas **não** são divergência, e cada uma tem um motivo:
 * — campo vazio na base é campo que a base não tem (telefone, e-mail de assinatura
 *   e endereço fiscal não existem na origem — R10 do PRD);
 * — diferença de acento, caixa ou espaço é a mesma coisa escrita de outro jeito;
 * — completar o contato que veio só com o primeiro nome é o que se pediu ao
 *   Comercial fazer (R9). Trocar por outra pessoa, aí sim, é divergir.
 *
 * Completar vale **só** para o contato. Em razão social, "Comércio Exemplo"
 * virando "Comércio Exemplo ME" muda a pessoa jurídica, e é isso que o
 * Financeiro precisa ver antes de emitir a nota.
 */
export function compararComABase(
  digitado: Cadastro, base: Cadastro,
): DivergenciaDeCadastro[] {
  const saida: DivergenciaDeCadastro[] = []

  for (const { campoId, rotulo } of COMPARAVEIS) {
    const valorDaBase = (base[campoId] ?? '').trim()
    const valorDigitado = (digitado[campoId] ?? '').trim()
    if (valorDaBase === '' || valorDigitado === '') continue

    const a = normalizar(valorDigitado)
    const b = normalizar(valorDaBase)
    if (a === b) continue
    // Completar o primeiro nome: "fernando" vira "fernando ribeiro".
    if (campoId === 'contato' && a.startsWith(`${b} `)) continue

    saida.push({ campoId, rotulo, valorDigitado, valorDaBase })
  }

  return saida
}

/**
 * Os valores da base para os campos que divergiram.
 *
 * O botão do componente diz "Registrar divergência e **seguir com o da base**".
 * Sem isto ele registraria e seguiria com o digitado — a tela mostraria uma
 * coisa e o pedido nasceria com outra.
 */
export function valoresDaBase(
  divergencias: DivergenciaDeCadastro[],
): Partial<Record<CampoId, string>> {
  return Object.fromEntries(divergencias.map((d) => [d.campoId, d.valorDaBase]))
}
