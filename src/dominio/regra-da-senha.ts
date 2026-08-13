/**
 * O que vale como senha, e por quê.
 *
 * Puro e sem `node:crypto` de propósito: a mesma regra roda no formulário,
 * enquanto a pessoa digita, e no Server Action, para valer. `dominio/senha.ts`
 * — que faz o scrypt — não pode ser importado pelo cliente.
 */

/** O mínimo que a Esteira aceita. */
export const MINIMO = 8

/**
 * As senhas que qualquer varredura tenta primeiro.
 *
 * A lista é curta de propósito: não é um dicionário, é a primeira página de
 * qualquer lista de ataque. Barrar estas seis não torna a senha forte — só
 * impede a troca obrigatória de terminar onde começou.
 */
export const CONHECIDAS = [
  '123456', '1234', '12345', '1234567', '12345678', '123456789', '1234567890',
  'senha', 'senha123', 'password', 'admin', 'mudar123', 'qwerty', 'abc123',
  'esteira', 'bko', '111111', '000000',
]

/** Sem acento, sem caixa: "Senha123" e "senha123" são a mesma tentativa. */
function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Devolve o motivo da recusa, ou `null` quando a senha serve.
 *
 * Mensagem por mensagem, e não uma lista: quem está trocando a senha corrige
 * uma coisa de cada vez, e a primeira que falta é a que interessa.
 */
export function validarNovaSenha(senha: string, confirmacao: string): string | null {
  if (senha.length < MINIMO) {
    return `A senha precisa ter pelo menos ${MINIMO} caracteres.`
  }
  if (CONHECIDAS.includes(normalizar(senha))) {
    return 'Essa senha está nas listas que qualquer varredura tenta primeiro. Escolha outra.'
  }
  // Só dígitos passa nos oito caracteres e não resiste a nada: "12345678"
  // sozinho já está na lista, mas "20031995" não estaria.
  if (/^\d+$/.test(senha)) {
    return 'Só números é fácil demais de adivinhar. Misture letras.'
  }
  if (senha !== confirmacao) {
    return 'As duas senhas não são iguais.'
  }
  return null
}
