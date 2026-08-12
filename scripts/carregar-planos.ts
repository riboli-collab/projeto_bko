import path from 'node:path'
import { db } from '@/db/cliente'
import { planos } from '@/db/schema'
import { lerPlanos } from '@/db/carga/custos'

/**
 * Carrega **só** o catálogo de planos.
 *
 * Existe separado de `carregar.ts` porque a base de clientes e o catálogo têm
 * naturezas diferentes: plano é dado de negócio — operadora, nome e custo por
 * linha — e pode ir para um banco hospedado; cadastro de cliente é CPF, e-mail
 * e telefone de gente, e a decisão de hospedá-lo é de quem responde pela base,
 * não de quem faz o deploy.
 *
 * `DATABASE_URL` vem do ambiente, então o mesmo script serve para o Postgres
 * local e para o de produção.
 */
const DADOS = path.resolve(process.cwd(), '..', 'dados')

async function main() {
  const catalogo = lerPlanos(path.join(DADOS, '_catalogo-planos.csv'))

  await db.insert(planos).values(
    catalogo.map((p) => ({
      id: p.id, nome: p.nome, operadora: p.operadora,
      custoPorLinha: p.custoPorLinha?.toFixed(2) ?? null,
      origemDoCusto: p.origem,
    })),
  ).onConflictDoNothing()

  const por = (o: string) => catalogo.filter((p) => p.origem === o).length
  console.log(`planos carregados:   ${catalogo.length}`)
  console.log(`  custo de contrato: ${por('contrato')} — bloqueio vale como conferência`)
  console.log(`  custo só lançado:  ${por('lancado')} — bloqueia, mas não foi conferido`)
  console.log(`  sem custo:         ${por('ausente')} — a trava não consegue conferir`)
  process.exit(0)
}

main()
