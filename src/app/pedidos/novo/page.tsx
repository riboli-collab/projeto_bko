import { db } from '@/db/cliente'
import { planos } from '@/db/schema'
import { DOCUMENTOS } from '@/dominio/documentos'
import { TelaEntrada } from '@/telas/TelaEntrada'

export default async function NovoPedido() {
  const catalogo = await db.select().from(planos)
  return <TelaEntrada opcoes={{
    operadoras: ['Vivo', 'Claro', '2BX', 'TIM'],
    canaisDeVenda: ['IG', 'MAN', '2BX', 'Operadora direto'],
    empresasFaturadoras: ['IG', 'MAN', '2BX'],
    tiposDeAcao: ['Linha nova', 'Portabilidade', 'Troca'],
    tiposDeChip: ['Físico', 'eSIM'],
    formasDeEntrega: ['Retirada no escritório', 'Motoboy', 'Correios'],
    // `custoPorLinha` é o que o componente lê para montar o painel de preço;
    // `origem` é o que diz se aquele número foi conferido contra contrato.
    planos: catalogo.map((p) => ({
      id: p.id, nome: p.nome, operadora: p.operadora,
      custoPorLinha: p.custoPorLinha === null ? null : Number(p.custoPorLinha),
      origem: p.origemDoCusto,
    })),
    documentos: [...DOCUMENTOS],
  } as any} />
}
