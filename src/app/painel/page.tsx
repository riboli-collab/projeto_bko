import { montarPainel } from '@/consultas/painel'
import { TelaPainel } from '@/telas/TelaPainel'

export default async function Painel() {
  return <TelaPainel dados={await montarPainel()} />
}
