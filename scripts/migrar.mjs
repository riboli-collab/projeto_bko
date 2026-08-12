import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/**
 * Aplica as migrações antes do app subir.
 *
 * Escrito em `.mjs` e usando só `drizzle-orm` e `postgres` — as duas são
 * dependências de produção. `drizzle-kit` e `tsx` são de desenvolvimento e
 * podem não existir no contêiner: migração que depende delas quebra no deploy,
 * não no build, que é o pior lugar para descobrir.
 */
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não definida — a migração não tem onde rodar.')
  process.exit(1)
}

// `max: 1` porque migração é sequencial; pool aqui só atrapalha.
const sql = postgres(url, { max: 1 })

try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle' })
  console.log('Migrações aplicadas.')
} catch (erro) {
  console.error('Falha ao migrar:', erro.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
