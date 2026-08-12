import { FormularioDeEntrada } from './FormularioDeEntrada'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Entrar — Esteira' }

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>
}) {
  const { de } = await searchParams
  return <FormularioDeEntrada de={de ?? '/painel'} />
}
