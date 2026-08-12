import { describe, it, expect } from 'vitest'
import { db } from '@/db/cliente'
import { sql } from 'drizzle-orm'

describe('conexão com o Postgres', () => {
  it('responde a uma consulta trivial', async () => {
    const linhas = await db.execute(sql`select 1 as um`)
    expect(linhas[0]).toEqual({ um: 1 })
  })

  it('tem as sete tabelas da Esteira criadas', async () => {
    const linhas = await db.execute(sql`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name
    `)
    const nomes = linhas.map((l) => l.table_name)
    expect(nomes).toEqual([
      'clientes',
      'clientes_rejeitados',
      'historico_de_situacao',
      'pedidos',
      'pendencias',
      'planos',
      'sequencia_de_pedido',
    ])
  })
})
