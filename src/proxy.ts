import { NextResponse, type NextRequest } from 'next/server'
import { NOME_DO_COOKIE, ehAberto, sessaoValida } from '@/dominio/sessao'

/**
 * A tranca da porta.
 *
 * Chama-se `proxy` porque o Next 16 renomeou a convenção `middleware`: o nome
 * antigo ainda funciona, mas avisa a cada requisição que está a caminho da
 * remoção — e aviso ignorado vira quebra numa atualização futura.
 *
 * Sem `SENHA_DE_ACESSO` definida, a Esteira fica aberta — é o que permite rodar
 * local e nos testes sem cerimônia. Em produção a variável existe, e o deploy
 * avisa no log se ela sumir: aberto por engano e aberto de propósito têm de ser
 * distinguíveis por quem lê o log, não só por quem leu o código.
 */
/**
 * O layout raiz precisa saber em que rota está para não desenhar a barra de
 * navegação — nem consultar o banco — na tela de senha. Componente de servidor
 * não enxerga o caminho; este cabeçalho é como ele chega lá.
 */
function seguir(requisicao: NextRequest) {
  const cabecalhos = new Headers(requisicao.headers)
  cabecalhos.set('x-caminho', requisicao.nextUrl.pathname)
  return NextResponse.next({ request: { headers: cabecalhos } })
}

export async function proxy(requisicao: NextRequest) {
  const senha = process.env.SENHA_DE_ACESSO
  if (!senha) return seguir(requisicao)

  const caminho = requisicao.nextUrl.pathname
  if (ehAberto(caminho)) return seguir(requisicao)

  if (await sessaoValida(requisicao.cookies.get(NOME_DO_COOKIE)?.value, senha)) {
    return seguir(requisicao)
  }

  const destino = requisicao.nextUrl.clone()
  destino.pathname = '/entrar'
  // Guarda para onde a pessoa ia: depois de entrar, ela cai no lugar que pediu,
  // e não numa home genérica que a obriga a navegar de novo.
  destino.search = caminho === '/' ? '' : `?de=${encodeURIComponent(caminho + requisicao.nextUrl.search)}`
  return NextResponse.redirect(destino)
}

export const config = {
  /**
   * Tudo, menos o que o navegador busca sozinho: os arquivos do Next, o ícone e
   * o que está em `public/`. Redirecionar um `.js` para a tela de senha entrega
   * HTML onde o navegador espera script, e a página quebra sem dizer por quê.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)'],
}
