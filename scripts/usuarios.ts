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
 * Sem senha no comando, ela é **sorteada e mostrada uma vez**. Não há como
 * recuperá-la depois — só sortear outra. Isto é intencional: o banco guarda
 * scrypt, e um banco de onde se lê a senha de volta é um banco que vaza a senha
 * junto. Passando a senha no comando, ela é definida como veio.
 *
 *   npx tsx --env-file=.env.local scripts/usuarios.ts listar
 *   npx tsx --env-file=.env.local scripts/usuarios.ts criar raquel "Raquel" Liderança
 *   npx tsx --env-file=.env.local scripts/usuarios.ts senha raquel
 *   npx tsx --env-file=.env.local scripts/usuarios.ts senha raquel 123456
 *   npx tsx --env-file=.env.local scripts/usuarios.ts desativar raquel
 *   npx tsx --env-file=.env.local scripts/usuarios.ts ativar raquel
 */

const USO = `
Uso:
  listar
  criar <usuario> "<Nome completo>" <Papel> [senha]
  senha <usuario> [senha]             sem a senha, sorteia uma e mostra uma vez
  desativar <usuario>                 tira o acesso, preserva o histórico
  ativar <usuario>
`.trim()

/**
 * As senhas que qualquer lista de ataque tenta primeiro.
 *
 * Não recusa nada — quem administra decide. Mas dizer em voz alta é diferente
 * de deixar passar em silêncio: uma senha padrão numa URL pública é a porta
 * aberta mais comum que existe, e quem definir uma precisa ter escolhido isso,
 * não ter esbarrado nisso.
 */
const CONHECIDAS = [
  '123456', '1234', '12345', '1234567', '12345678', '123456789',
  'senha', 'password', 'admin', 'mudar123', 'qwerty', 'abc123',
]

function avisarSeFraca(senha: string) {
  const fraca = CONHECIDAS.includes(senha.toLowerCase()) || senha.length < 8
  if (!fraca) return
  console.warn('')
  console.warn('  AVISO: esta senha está nas listas de ataque ou é curta demais.')
  console.warn('  A Esteira fica numa URL pública e guarda CPF, e-mail e telefone')
  console.warn('  de clientes. Vale como senha temporária, não como definitiva.')
}

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
function anunciarSenha(usuario: string, senha: string, sorteada: boolean) {
  console.log('')
  console.log(`  usuário: ${usuario}`)
  console.log(`  senha:   ${senha}`)
  console.log('')
  if (sorteada) {
    console.log('  Entregue por um canal que a pessoa controle e peça que ela não a compartilhe.')
    console.log('  Não há como recuperá-la depois — só sortear outra com `senha`.')
  } else {
    console.log('  Definida por quem administra. Não há como lê-la de volta do banco.')
  }
  avisarSeFraca(senha)
}

async function criar(usuario: string, nome: string, papel: string, definida?: string) {
  if (!usuario || !nome || !papel) encerrar(USO)
  const chave = normalizarUsuario(usuario)
  if (!/^[a-z][a-z0-9.-]{1,30}$/.test(chave)) {
    encerrar('Usuário: letras minúsculas, números, ponto e hífen; começando por letra.')
  }

  const [existe] = await db.select({ id: usuarios.id }).from(usuarios)
    .where(eq(usuarios.usuario, chave))
  if (existe) encerrar(`Já existe o usuário "${chave}". Para trocar a senha, use \`senha ${chave}\`.`)

  const senha = definida || senhaSorteada()
  await db.insert(usuarios).values({
    usuario: chave, nome: nome.trim(), papel: papel.trim(), senhaHash: await gerarHash(senha),
    // Toda senha que quem administra conhece é de estreia. A pessoa troca na
    // primeira entrada, e a partir dali ninguém mais sabe a senha dela.
    precisaTrocarSenha: true,
  })

  console.log(`Criado: ${nome.trim()} (${papel.trim()}).`)
  anunciarSenha(chave, senha, !definida)
}

async function trocarSenha(usuario: string, definida?: string) {
  const chave = normalizarUsuario(usuario)
  const senha = definida || senhaSorteada()
  const alterados = await db.update(usuarios)
    // Volta a ser de estreia: quem administra acabou de conhecer esta senha, e
    // a pessoa troca na próxima entrada.
    .set({ senhaHash: await gerarHash(senha), precisaTrocarSenha: true })
    .where(eq(usuarios.usuario, chave)).returning({ nome: usuarios.nome })

  if (!alterados.length) encerrar(`Não existe o usuário "${chave}".`)
  console.log(`Nova senha para ${alterados[0].nome}. Ela troca na próxima entrada.`)
  // A sessão aberta continua valendo: ela é assinada com SEGREDO_DA_SESSAO, não
  // com a senha. Para derrubar todas as sessões de todo mundo, troque o segredo.
  anunciarSenha(chave, senha, !definida)
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
    case 'criar': await criar(resto[0], resto[1], resto[2], resto[3]); break
    case 'senha': await trocarSenha(resto[0], resto[1]); break
    case 'desativar': await marcarAtivo(resto[0], false); break
    case 'ativar': await marcarAtivo(resto[0], true); break
    default: encerrar(USO)
  }
  process.exit(0)
}

main()
