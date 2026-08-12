import type { EstadoDoPrazo, SituacaoId } from './tipos'
import { situacao } from './situacoes'
import { ehFeriado } from './feriados'

const UM_DIA = 24 * 60 * 60 * 1000

function meiaNoite(data: Date): Date {
  const c = new Date(data)
  c.setHours(0, 0, 0, 0)
  return c
}

/**
 * Dias úteis entre duas datas: segunda a sexta, descontando feriado nacional.
 *
 * O QUE ESTE CÁLCULO AINDA NÃO SABE, e é preciso saber:
 * - **Horário de expediente.** Um pedido que chega às 17h com prazo de 4 horas
 *   vence às 21h de hoje ou às 11h de amanhã? Regra P2 do PRD, `A CONFIRMAR`.
 * - **Carnaval e Corpus Christi.** São ponto facultativo, não feriado. Se o BKO
 *   fecha, `FERIADOS_LOCAIS` resolve — mas ninguém respondeu.
 * - **Feriado municipal e estadual.** Nem se sabe em que município o BKO opera.
 *
 * As três estão em `feriados.ts`, explícitas. Nenhuma foi adivinhada.
 */
export function diasUteisEntre(inicio: Date, fim: Date): number {
  const a = meiaNoite(inicio)
  const b = meiaNoite(fim)
  if (b <= a) return 0

  let uteis = 0
  for (let t = a.getTime() + UM_DIA; t <= b.getTime(); t += UM_DIA) {
    const data = new Date(t)
    const dia = data.getDay()
    if (dia !== 0 && dia !== 6 && !ehFeriado(data)) uteis++
  }
  return uteis
}

export function estadoDoPrazo(a: {
  situacaoId: SituacaoId
  diasParados: number
  dataPortabilidade?: string | null
  hoje?: Date
}): EstadoDoPrazo {
  const s = situacao(a.situacaoId)

  if (s.encerra) return 'encerrado'
  if (a.situacaoId === 'DEVOLVIDO') return 'pausado'
  if (a.situacaoId === 'PARADO') return 'estourado'

  // O prazo não é duração: é a data agendada, obrigatória para entrar no status.
  if (a.situacaoId === 'AGUARDANDO_PORTABILIDADE') {
    if (!a.dataPortabilidade) return 'em-dia'
    const hoje = meiaNoite(a.hoje ?? new Date())
    const agendada = meiaNoite(new Date(`${a.dataPortabilidade}T12:00:00`))
    if (agendada < hoje) return 'estourado'
    if (agendada.getTime() - hoje.getTime() <= UM_DIA) return 'atencao'
    return 'em-dia'
  }

  if (s.prazoDiasUteis === null) return 'em-dia'
  if (a.diasParados > s.prazoDiasUteis) return 'estourado'
  if (a.diasParados >= s.prazoDiasUteis) return 'atencao'
  return 'em-dia'
}
