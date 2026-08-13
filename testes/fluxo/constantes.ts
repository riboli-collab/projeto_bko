/** Compartilhado entre a config do Playwright e os specs. Nunca vai a produção. */

/**
 * A pessoa dos specs de fluxo é **Liderança**, e não por acaso.
 *
 * Os specs de fluxo testam o trabalho — o pedido nascendo, andando, sendo
 * finalizado —, e a Liderança é o papel que cobre a esteira inteira. Com um
 * papel restrito, eles passariam a testar permissão sem querer, e uma mudança
 * na regra de papel quebraria quarenta specs que não falam de papel nenhum.
 * Quem testa papel é `papeis.spec.ts`.
 */
export const USUARIO_DO_TESTE = 'teste'
export const SENHA_DO_TESTE = 'senha-do-teste-de-acesso'
export const NOME_DO_TESTE = 'Pessoa de Teste'
export const PAPEL_DO_TESTE = 'Liderança'

/** Uma segunda pessoa: é ela que prova que o histórico grava quem agiu. */
export const OUTRO_USUARIO = 'teste2'
export const OUTRO_NOME = 'Outra Pessoa'
export const OUTRO_PAPEL = 'BKO'

/** Uma terceira, do Comercial: quem abre pedido e não move nenhum. */
export const USUARIO_COMERCIAL = 'teste3'
export const NOME_COMERCIAL = 'Pessoa do Comercial'

/**
 * A chave que assina a sessão nos testes.
 *
 * Fixa de propósito: a suíte roda com a proteção **ligada**, como em produção,
 * e uma chave sorteada a cada execução invalidaria a sessão guardada entre os
 * projetos do Playwright.
 */
export const SEGREDO_DO_TESTE = 'segredo-de-sessao-so-do-teste-nao-vai-a-producao'

/** Onde a sessão autenticada fica guardada entre os specs. Ignorado pelo git. */
export const ARQUIVO_DE_SESSAO = 'testes/.sessao.json'
