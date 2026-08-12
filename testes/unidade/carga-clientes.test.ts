import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { lerClientes } from '@/db/carga/clientes'
import { lerPlanos } from '@/db/carga/custos'

const DADOS = path.resolve(__dirname, '../../../dados')

describe('leitura de dados/clientes.csv', () => {
  const { validos, rejeitados } = lerClientes(path.join(DADOS, 'clientes.csv'))

  it('lê as 1.126 linhas da base', () => {
    expect(validos.length + rejeitados.length).toBe(1126)
  })

  it('aceita só documento de 11 ou 14 dígitos, e rejeita os 4 fora do padrão', () => {
    expect(rejeitados).toHaveLength(4)
    expect(validos).toHaveLength(1122)
    for (const c of validos) expect([11, 14]).toContain(c.cnpjCpf.length)
  })

  it('não corrige documento por dedução — registra o motivo (RN7)', () => {
    for (const r of rejeitados) {
      expect(r.motivo).toMatch(/dígitos/)
      expect(r.documentoBruto).not.toBe('')
    }
  })

  it('não duplica CNPJ/CPF', () => {
    const docs = new Set(validos.map((c) => c.cnpjCpf))
    expect(docs.size).toBe(validos.length)
  })

  it('deixa vazios os três campos que a base não tem', () => {
    // A base traz cnpj_cpf, tipo, razao_social, contato, email_cobranca.
    // Não traz telefone, e-mail de assinatura nem endereço fiscal — verificado
    // também nas sete abas da planilha de origem.
    const comAlgum = validos.filter(
      (c) => c.telefone !== '' || c.emailAssinatura !== '' || c.enderecoFiscal !== null,
    )
    expect(comAlgum).toHaveLength(0)
  })

  it('marca como incompleto o contato que veio só com o primeiro nome', () => {
    // 1.108 dos 1.126 têm só uma palavra. Sem esta marca, a busca preenche um
    // valor que a validação da Entrada recusa — em 98,4% dos clientes.
    const semSobrenome = validos.filter((c) => c.contatoIncompleto)
    expect(semSobrenome.length).toBeGreaterThan(1000)
    for (const c of semSobrenome) expect(c.contato.trim().split(/\s+/)).toHaveLength(1)

    const completos = validos.filter((c) => !c.contatoIncompleto)
    for (const c of completos) expect(c.contato.trim().split(/\s+/).length).toBeGreaterThan(1)
  })

  it('separa PF de PJ pelo campo tipo', () => {
    expect(validos.filter((c) => c.tipo === 'PF').length).toBeGreaterThan(500)
    expect(validos.filter((c) => c.tipo === 'PJ').length).toBeGreaterThan(500)
  })
})

describe('leitura do catálogo de planos', () => {
  const planos = lerPlanos(path.join(DADOS, '_catalogo-planos.csv'))

  it('lê as 86 combinações de plano × operadora', () => {
    expect(planos).toHaveLength(86)
  })

  it('separa as três procedências do custo', () => {
    const por = (o: string) => planos.filter((p) => p.origem === o)
    expect(por('contrato')).toHaveLength(18)
    expect(por('lancado')).toHaveLength(67)
    expect(por('ausente')).toHaveLength(1)
  })

  it('só a Vivo tem custo conferido contra contrato', () => {
    const contratados = planos.filter((p) => p.origem === 'contrato')
    expect(new Set(contratados.map((p) => p.operadora))).toEqual(new Set(['Vivo']))
  })

  it('a trava tem custo para 85 das 86 combinações', () => {
    expect(planos.filter((p) => p.custoPorLinha !== null)).toHaveLength(85)
  })

  it('deixa o custo nulo em vez de zero quando não há custo nenhum', () => {
    for (const p of planos.filter((x) => x.origem === 'ausente')) {
      expect(p.custoPorLinha).toBeNull()
    }
    for (const p of planos) expect(p.custoPorLinha).not.toBe(0)
  })

  it('prefere o contratado ao lançado — eles divergem em 12 combinações', () => {
    const vivo6 = planos.find((p) => p.nome === 'ilimitado 6 GB' && p.operadora === 'Vivo')!
    expect(vivo6.origem).toBe('contrato')
    expect(vivo6.custoPorLinha).toBe(14.99)   // contrato; o lançado é 18,99
  })
})
