import { NextResponse, type NextRequest } from 'next/server'
import { NOME_DO_COOKIE, TROCA_DE_SENHA, ehAberto, usuarioDaSessao } from '@/dominio/sessao'

/**
 * A porta.
 *
 * Chama-se `proxy` porque o Next 16 renomeou a convenção `middleware`: o nome
 * antigo ainda funciona, mas avisa a cada requisição que está a caminho da
 * remoção — e aviso ignorado vira quebra numa atualização futura.
 *
 * Aqui só se confere **se** a sessão vale, nunca **quem** pode o quê: isto roda
 * no Edge, sem banco. Nome, papel e se a pessoa continua ativa são resolvidos
 * no servidor, em `app/acoes/sessao.ts`.
 *
 * Sem `SEGREDO_DA_SESSAO` não há como assinar nem conferir sessão nenhuma, e o
 * app fecha em vez de abrir: variável faltando é falha de configuração, e falha
 * de configuração que destranca a porta é a pior espécie.
 */
function seguir(requisicao: NextRequest) {
  const cabecalhos = new Headers(requisicao.headers)
  // O layout raiz precisa saber a rota para não desenhar a navegação — nem
  // consultar o banco — na tela de entrada. Componente de servidor não enxerga
  // o caminho; este cabeçalho é como ele chega lá.
  cabecalhos.set('x-caminho', requisicao.nextUrl.pathname)
  return NextResponse.next({ request: { headers: cabecalhos } })
}

function paraAEntrada(requisicao: NextRequest) {
  const caminho = requisicao.nextUrl.pathname
  const destino = requisicao.nextUrl.clone()
  destino.pathname = '/entrar'
  // Guarda para onde a pessoa ia: depois de entrar, ela cai no lugar que pediu,
  // e não numa home genérica que a obriga a navegar de novo.
  destino.search = caminho === '/' ? '' : `?de=${encodeURIComponent(caminho + requisicao.nextUrl.search)}`
  return NextResponse.redirect(destino)
}

export async function proxy(requisicao: NextRequest) {
  const caminho = requisicao.nextUrl.pathname
  if (ehAberto(caminho)) return seguir(requisicao)

  const segredo = process.env.SEGREDO_DA_SESSAO
  if (!segredo) return paraAEntrada(requisicao)

  const sessao = await usuarioDaSessao(requisicao.cookies.get(NOME_DO_COOKIE)?.value, segredo)
  if (!sessao) return paraAEntrada(requisicao)

  // Enquanto a senha for a que quem administra definiu, a única tela que abre é
  // a da troca. O aviso vem assinado dentro do cookie — o Edge não tem banco
  // para perguntar, e editar o cookie quebra a assinatura.
  if (sessao.precisaTrocarSenha && requisicao.nextUrl.pathname !== TROCA_DE_SENHA) {
    const destino = requisicao.nextUrl.clone()
    destino.pathname = TROCA_DE_SENHA
    destino.search = ''
    return NextResponse.redirect(destino)
  }

  return seguir(requisicao)
}

export const config = {
  /**
   * Tudo, menos o que o navegador busca sozinho: os arquivos do Next, o ícone e
   * o que está em `public/`. Redirecionar um `.js` para a tela de entrada
   * entrega HTML onde o navegador espera script, e a página quebra sem dizer
   * por quê.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)'],
}
