import type {
  Endereco,
  EnderecoDeEntrega,
} from '../types'
import { CampoTexto } from './Campos'
import type { EstadoDoCampo } from './estilos'

interface CamposDeEnderecoProps {
  endereco: Endereco | EnderecoDeEntrega
  /** Prefixo dos ids dos campos — separa o endereço fiscal do de entrega na mesma tela. */
  prefixoId: string
  legenda: string
  /** O número do campo no pedido. O endereço é um campo só, repartido em sete caixas. */
  numeroDoCampo?: number
  /** O endereço de entrega pede quem recebe; o fiscal, não. */
  comRecebedor?: boolean
  estado?: EstadoDoCampo
  onChange?: (endereco: Endereco | EnderecoDeEntrega) => void
}

/**
 * As partes de um endereço.
 *
 * Serve aos dois endereços da tela: o fiscal, que é onde a empresa está registrada,
 * e o de entrega, que só existe em motoboy e Correios. Faltando qualquer parte —
 * menos o complemento — o campo conta como incompleto, que é a regra da SOP e a
 * causa de boa parte das devoluções.
 */
export function CamposDeEndereco({
  endereco,
  prefixoId,
  legenda,
  numeroDoCampo,
  comRecebedor = false,
  estado,
  onChange,
}: CamposDeEnderecoProps) {
  const alterar = (parcial: Partial<EnderecoDeEntrega>) =>
    onChange?.({ ...endereco, ...parcial } as Endereco | EnderecoDeEntrega)

  const recebedor = (endereco as EnderecoDeEntrega).recebedor ?? ''

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 flex flex-wrap items-baseline gap-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        {legenda}
        {numeroDoCampo !== undefined && (
          <span className="text-[10px] uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">
            Campo {numeroDoCampo}
          </span>
        )}
      </legend>

      <div className="grid gap-4 sm:grid-cols-6">
        <CampoTexto
          id={`${prefixoId}-logradouro`}
          rotulo="Logradouro"
          obrigatorio
          estado={estado}
          className="sm:col-span-4"
          valor={endereco.logradouro}
          onChange={(valor) => alterar({ logradouro: valor })}
          placeholder="Rua, avenida…"
        />
        <CampoTexto
          id={`${prefixoId}-numero`}
          rotulo="Número"
          obrigatorio
          estado={estado}
          className="sm:col-span-2"
          valor={endereco.numero}
          onChange={(valor) => alterar({ numero: valor })}
          mono
        />
        <CampoTexto
          id={`${prefixoId}-complemento`}
          rotulo="Complemento"
          estado={estado}
          className="sm:col-span-3"
          valor={endereco.complemento}
          onChange={(valor) => alterar({ complemento: valor })}
          placeholder="Sala, galpão, bloco"
        />
        <CampoTexto
          id={`${prefixoId}-bairro`}
          rotulo="Bairro"
          obrigatorio
          estado={estado}
          className="sm:col-span-3"
          valor={endereco.bairro}
          onChange={(valor) => alterar({ bairro: valor })}
        />
        <CampoTexto
          id={`${prefixoId}-cidade`}
          rotulo="Cidade"
          obrigatorio
          estado={estado}
          className="sm:col-span-3"
          valor={endereco.cidade}
          onChange={(valor) => alterar({ cidade: valor })}
        />
        <CampoTexto
          id={`${prefixoId}-estado`}
          rotulo="UF"
          obrigatorio
          estado={estado}
          className="sm:col-span-1"
          valor={endereco.estado}
          onChange={(valor) => alterar({ estado: valor.toUpperCase().slice(0, 2) })}
          maxLength={2}
          mono
        />
        <CampoTexto
          id={`${prefixoId}-cep`}
          rotulo="CEP"
          obrigatorio
          estado={estado}
          className="sm:col-span-2"
          valor={endereco.cep}
          onChange={(valor) => alterar({ cep: valor })}
          placeholder="00000-000"
          inputMode="numeric"
          mono
        />

        {comRecebedor && (
          <CampoTexto
            id={`${prefixoId}-recebedor`}
            rotulo="Quem recebe"
            obrigatorio
            estado={estado}
            className="sm:col-span-6"
            valor={recebedor}
            onChange={(valor) => alterar({ recebedor: valor })}
            placeholder="Nome de quem assina o recebimento"
          />
        )}
      </div>
    </fieldset>
  )
}
