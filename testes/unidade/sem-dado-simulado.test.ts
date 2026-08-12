import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { count, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { clientes, planos } from '@/db/schema'

const FICCOES = [
  'Mercado Central Distribuidora Ltda',
  'Hotel Beira Rio',
  'Auto Peças Norte Ltda',
  'Claro Negócios 40GB',
]

describe('nenhum dado simulado apresentado como real', () => {
  it('não importa sample-data.json fora da pasta de testes', () => {
    // Procura o **uso**, não a palavra: comentário citando o pacote de design é
    // rastreabilidade, e é bem-vindo. Import e leitura de arquivo é que não.
    const achados = execSync(
      `grep -rnE "(from|require|readFile[^(]*\\()[^\\n]*sample-data" src/ || true`,
      { encoding: 'utf8' },
    ).trim()
    expect(achados).toBe('')
  })

  it('não copiou sample-data.json para dentro de src/', () => {
    const achados = execSync(`find src -name 'sample-data.json' || true`, { encoding: 'utf8' }).trim()
    expect(achados).toBe('')
  })

  it('a base carregada tem os 1.122 clientes reais, não os 6 do exemplo', async () => {
    const [{ total }] = await db.select({ total: count() }).from(clientes)
    // `>=` e não `===`: uso real cria cliente novo, e o pedido do Comercial é
    // exatamente isso. O que a guarda protege é o piso — a base inteira
    // carregada, nunca a amostra de seis do pacote de design.
    expect(total).toBeGreaterThanOrEqual(1122)
  })

  it('nenhum cliente fictício do pacote de design entrou no banco', async () => {
    const achados = await db.select().from(clientes).where(inArray(clientes.razaoSocial, FICCOES))
    expect(achados).toHaveLength(0)
  })

  it('nenhum plano fictício entrou no banco', async () => {
    const achados = await db.select().from(planos).where(eq(planos.nome, 'Claro Negócios 40GB'))
    expect(achados).toHaveLength(0)
  })

  it('plano sem custo é NULL, nunca zero — zero passaria por "de graça" na trava', async () => {
    const todos = await db.select().from(planos)
    const zerados = todos.filter((p) => p.custoPorLinha !== null && Number(p.custoPorLinha) === 0)
    expect(zerados).toHaveLength(0)
  })

  it('todo plano carrega a procedência do custo — nenhum entra sem ela', async () => {
    const todos = await db.select().from(planos)
    expect(todos).toHaveLength(86)
    for (const p of todos) {
      expect(['contrato', 'lancado', 'ausente']).toContain(p.origemDoCusto)
    }
    expect(todos.filter((p) => p.origemDoCusto === 'contrato')).toHaveLength(18)
    expect(todos.filter((p) => p.origemDoCusto === 'lancado')).toHaveLength(67)
  })

  it('custo lançado nunca é apresentado como se fosse contratado', async () => {
    // A guarda de verdade está na tela (Tarefa 8); aqui garante-se que o dado
    // chega distinguível. Se origem virasse coluna opcional, a tela perderia
    // a informação em silêncio — e um palpite passaria por conferência.
    const todos = await db.select().from(planos)
    const semOrigem = todos.filter((p) => !p.origemDoCusto)
    expect(semOrigem).toHaveLength(0)
  })
})
