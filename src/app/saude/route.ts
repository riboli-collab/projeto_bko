/**
 * Por onde o Railway pergunta se o app subiu.
 *
 * Fica fora da tranca de propósito: o healthcheck não digita senha, e se ele
 * bater na tela de entrada todo deploy é reprovado e revertido — com a
 * aplicação funcionando perfeitamente.
 *
 * Não consulta o banco: aqui a pergunta é "o processo respondeu", e misturar a
 * saúde do Postgres faria uma instabilidade do banco derrubar a aplicação
 * inteira em vez de degradar uma tela.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ ok: true, servico: 'esteira' })
}
