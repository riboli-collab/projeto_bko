import type { ReactNode } from 'react'
import { Database } from 'lucide-react'
import type { Pedido } from '../types'
import { CARTAO, MICRO_ROTULO, MONO, formatarData, formatarMoeda } from './estilos'

interface ItemProps {
  rotulo: string
  children: ReactNode
  mono?: boolean
  className?: string
}

function Item({ rotulo, children, mono = false, className = '' }: ItemProps) {
  return (
    <div className={className}>
      <dt className={MICRO_ROTULO}>{rotulo}</dt>
      <dd
        className={`mt-1 text-sm text-slate-900 dark:text-slate-100 ${mono ? 'tabular-nums' : ''}`}
        style={mono ? { fontFamily: MONO } : undefined}
      >
        {children}
      </dd>
    </div>
  )
}

interface DadosDoPedidoProps {
  pedido: Pedido
}

export function DadosDoPedido({ pedido }: DadosDoPedidoProps) {
  return (
    <section className={CARTAO}>
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dados do pedido</h2>
      </header>

      <dl className="grid gap-4 px-4 py-4 sm:grid-cols-3 sm:px-5 sm:py-5">
        <Item rotulo="Operadora">{pedido.operadora}</Item>
        <Item rotulo="Empresa faturadora">{pedido.empresaFaturadora}</Item>
        <Item rotulo="Responsável">{pedido.responsavel}</Item>

        <Item rotulo="Plano" className="sm:col-span-2">
          {pedido.plano}
        </Item>
        <Item rotulo="Quantidade de linhas" mono>
          {pedido.qtdLinhas}
        </Item>

        <Item rotulo="Tipo">{pedido.tipo}</Item>
        <Item rotulo="Valor de venda" mono>
          R$ {formatarMoeda(pedido.valorVenda)}
          <span className="ml-1 text-xs text-slate-400" style={{ fontFamily: 'inherit' }}>
            por linha
          </span>
        </Item>
        <Item rotulo="Vendedor">{pedido.vendedor}</Item>

        <Item rotulo="Forma de entrega">{pedido.formaDeEntrega}</Item>
        <Item rotulo="Entrada" mono>
          {formatarData(pedido.dataEntrada)}
        </Item>
        <Item rotulo="Portabilidade" mono>
          {pedido.dataPortabilidade ? (
            formatarData(pedido.dataPortabilidade)
          ) : (
            <span className="text-slate-400 dark:text-slate-600">—</span>
          )}
        </Item>

        {pedido.enderecoDeEntrega && (
          <Item rotulo="Endereço de entrega" className="sm:col-span-3">
            {pedido.enderecoDeEntrega}
          </Item>
        )}

        {pedido.observacao && (
          <Item rotulo="Observação" className="sm:col-span-3">
            <span className="leading-relaxed text-slate-600 dark:text-slate-400">
              {pedido.observacao}
            </span>
          </Item>
        )}
      </dl>
    </section>
  )
}

interface DadosDoClienteProps {
  pedido: Pedido
}

export function DadosDoCliente({ pedido }: DadosDoClienteProps) {
  const { cliente } = pedido

  return (
    <section className={CARTAO}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cliente</h2>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Database className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
          do cadastro
        </span>
      </header>

      <dl className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5">
        <Item rotulo="Razão social">{cliente.razaoSocial}</Item>
        <Item rotulo="CNPJ / CPF" mono>
          {cliente.cnpjCpf}
        </Item>
        <Item rotulo="Contato">{cliente.contato}</Item>
        <Item rotulo="Telefone (WhatsApp)" mono>
          {cliente.telefone}
        </Item>
        <Item rotulo="E-mail de assinatura">{cliente.emailAssinatura}</Item>
        <Item rotulo="E-mail do financeiro">{cliente.emailFinanceiro}</Item>
        <Item rotulo="Endereço fiscal" className="sm:col-span-2">
          {cliente.enderecoFiscal}
        </Item>
      </dl>
    </section>
  )
}
