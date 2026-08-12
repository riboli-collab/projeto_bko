import path from 'node:path'
import { db } from '@/db/cliente'
import { clientes, clientesRejeitados, planos } from '@/db/schema'
import { lerClientes } from '@/db/carga/clientes'
import { lerPlanos } from '@/db/carga/custos'

const DADOS = path.resolve(process.cwd(), '..', 'dados')

async function main() {
  const { validos, rejeitados } = lerClientes(path.join(DADOS, 'clientes.csv'))
  const catalogo = lerPlanos(path.join(DADOS, '_catalogo-planos.csv'))

  await db.delete(clientesRejeitados)
  await db.insert(clientes).values(validos).onConflictDoNothing()
  if (rejeitados.length) await db.insert(clientesRejeitados).values(rejeitados)
  await db.insert(planos).values(
    catalogo.map((p) => ({
      id: p.id, nome: p.nome, operadora: p.operadora,
      custoPorLinha: p.custoPorLinha?.toFixed(2) ?? null,
      origemDoCusto: p.origem,
    })),
  ).onConflictDoNothing()

  const por = (o: string) => catalogo.filter((p) => p.origem === o).length

  // Sem CPF, e-mail, telefone ou razão social na saída — nem em log (regra de privacidade).
  console.log(`clientes carregados: ${validos.length}`)
  console.log(`clientes rejeitados: ${rejeitados.length} (documento fora do padrão, fila de revisão)`)
  console.log(`planos carregados:   ${catalogo.length}`)
  console.log(`  custo de contrato: ${por('contrato')} — bloqueio vale como conferência`)
  console.log(`  custo só lançado:  ${por('lancado')} — bloqueia, mas não foi conferido`)
  console.log(`  sem custo:         ${por('ausente')} — a trava não consegue conferir`)
  process.exit(0)
}

main()
