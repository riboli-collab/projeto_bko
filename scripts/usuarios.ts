import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { usuarios } from '@/db/schema'
import { gerarHash, senhaSorteada } from '@/dominio/senha'
import { normalizarUsuario } from '@/consultas/usuarios'

/**
 * Gestão de quem entra na Esteira.
 *
 * Não há tela de administração: são seis pessoas num escritório, e uma tela de
 * cadastro de usuário seria mais superfície para manter do que o problema pede.
 * Quando houver rotatividade que justifique, vira tela.
 *
 * A senha é **sorteada aqui e mostrada uma vez**. Não há como recuperá-la
 * depois — só sortear outra. Isto é intencional: o banco guarda scrypt, e um
 * banco de onde se lê a senha de volta é um banco que vaza a senha junto.
 *
 *   npx tsx --env-file=.env.local scripts/usuarios.ts listar
 *   npx tsx --env-file=.env.local scripts/usuarios.ts criar raquel "Raquel" Liderança
 *   npx tsx --env-file=.env.local scripts/usuarios.ts senha raquel
 *   npx tsx --env-file=.env.local scripts/usuarios.ts desativar raquel
 *   npx tsx --env-file=.env.local scripts/usuarios.ts ativar raquel
 */

const USO = `
Uso:
  listar
  criar <usuario> "<Nome completo>" <Papel>
  senha <usuario>                     sorteia uma nova e mostra uma vez
  desativar <usuario>                 tira o acesso, preserva o histórico
  ativar <usuario>
`.trim()

function encerrar(mensagem: string, codigo = 1): never {
  console.error(mensagem)
  process.exit(codigo)
}

async function listar() {
  const linhas = await db
    .select({
      usuario: usuarios.usuario, nome: usuarios.nome, papel: usuarios.papel,
      ativo: usuarios.ativo, ultimoAcesso: usuarios.ultimoAcesso,
    })
    .from(usuarios).orderBy(asc(usuarios.usuario))

  if (!linhas.length) return console.log('Nenhum usuário. Crie o primeiro com `criar`.')

  const larguraUsuario = Math.max(7, ...linhas.map((l) => l.usuario.length))
  const larguraNome = Math.max(4, ...linhas.map((l) => l.nome.length))
  console.log(
    `${'USUÁRIO'.padEnd(larguraUsuario)}  ${'NOME'.padEnd(larguraNome)}  PAPEL         ÚLTIMO ACESSO`,
  )
  for (const l of linhas) {
    const quando = l.ultimoAcesso
      ? l.ultimoAcesso.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : 'nunca entrou'
    console.log(
      `${l.usuario.padEnd(larguraUsuario)}  ${l.nome.padEnd(larguraNome)}  ` +
      `${l.papel.padEnd(12)}  ${quando}${l.ativo ? '' : '   [DESATIVADO]'}`,
    )
  }
}

/** A senha aparece uma vez e só. Repetida em log ou histórico, deixa de ser senha. */
function anunciarSenha(usuario: string, senha: string) {
  console.log('')
  console.log(`  usuário: ${usuario}`)
  console.log(`  senha:   ${senha}`)
  console.log('')
  console.log('  Entregue por um canal que a pessoa controle e peça que ela não a compartilhe.')
  console.log('  Não há como recuperá-la depois — só sortear outra com `senha`.')
}

async function criar(usuario: string, nome: string, papel: string) {
  if (!usuario || !nome || !papel) encerrar(USO)
  const chave = normalizarUsuario(usuario)
  if (!/^[a-z][a-z0-9.-]{1,30}$/.test(chave)) {
    encerrar('Usuário: letras minúsculas, números, ponto e hífen; começando por letra.')
  }

  const [existe] = await db.select({ id: usuarios.id }).from(usuarios)
    .where(eq(usuarios.usuario, chave))
  if (existe) encerrar(`Já existe o usuário "${chave}". Para trocar a senha, use \`senha ${chave}\`.`)

  const senha = senhaSorteada()
  await db.insert(usuarios).values({
    usuario: chave, nome: nome.trim(), papel: papel.trim(), senhaHash: await gerarHash(senha),
  })

  console.log(`Criado: ${nome.trim()} (${papel.trim()}).`)
  anunciarSenha(chave, senha)
}

async function trocarSenha(usuario: string) {
  const chave = normalizarUsuario(usuario)
  const senha = senhaSorteada()
  const alterados = await db.update(usuarios)
    .set({ senhaHash: await gerarHash(senha) })
    .where(eq(usuarios.usuario, chave)).returning({ nome: usuarios.nome })

  if (!alterados.length) encerrar(`Não existe o usuário "${chave}".`)
  console.log(`Nova senha para ${alterados[0].nome}.`)
  // A sessão aberta continua valendo: ela é assinada com SEGREDO_DA_SESSAO, não
  // com a senha. Para derrubar todas as sessões de todo mundo, troque o segredo.
  anunciarSenha(chave, senha)
}

async function marcarAtivo(usuario: string, ativo: boolean) {
  const chave = normalizarUsuario(usuario)
  const alterados = await db.update(usuarios).set({ ativo })
    .where(eq(usuarios.usuario, chave)).returning({ nome: usuarios.nome })

  if (!alterados.length) encerrar(`Não existe o usuário "${chave}".`)
  console.log(
    ativo
      ? `${alterados[0].nome} voltou a ter acesso.`
      : `${alterados[0].nome} perdeu o acesso. O histórico assinado por essa pessoa continua intacto.`,
  )
}

async function main() {
  const [comando, ...resto] = process.argv.slice(2)

  switch (comando) {
    case 'listar': await listar(); break
    case 'criar': await criar(resto[0], resto[1], resto[2]); break
    case 'senha': await trocarSenha(resto[0]); break
    case 'desativar': await marcarAtivo(resto[0], false); break
    case 'ativar': await marcarAtivo(resto[0], true); break
    default: encerrar(USO)
  }
  process.exit(0)
}

main()
