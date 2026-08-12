import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Banco = ReturnType<typeof drizzle<typeof schema>>

/**
 * A conexão nasce na primeira consulta, não na importação do módulo.
 *
 * `next build` importa este arquivo ao coletar as páginas — inclusive as
 * `force-dynamic`, que não chegam a executar. Conectando na importação, o build
 * passa a **exigir** um banco de pé: quebra no deploy, onde o Postgres às vezes
 * ainda nem foi provisionado, e com um erro que aponta para o arquivo errado.
 */
let instancia: Banco | null = null

function conectar(): Banco {
  if (instancia) return instancia
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não está definida. Veja .env.local')
  instancia = drizzle(postgres(url, { max: 10 }), { schema })
  return instancia
}

export const db = new Proxy({} as Banco, {
  get(_alvo, prop) {
    const real = conectar()
    const valor = Reflect.get(real, prop)
    // Ligado ao objeto real: `db.transaction(...)` chamado pelo proxy perderia
    // o `this` e falharia só em tempo de execução, dentro de uma transação.
    return typeof valor === 'function' ? valor.bind(real) : valor
  },
})
