import fs from 'node:fs'

export interface NovoCliente {
  cnpjCpf: string
  tipo: 'PF' | 'PJ'
  razaoSocial: string
  contato: string
  /**
   * true quando o contato veio da base com só o primeiro nome — 1.108 dos 1.126.
   * A Entrada preenche o campo, exibe a marca "sobrenome faltando" e só deixa
   * enviar depois de completado. Sem isto, a tela recusa o valor que ela mesma
   * preencheu, em 98,4% dos clientes.
   */
  contatoIncompleto: boolean
  emailFinanceiro: string
  emailAssinatura: string
  telefone: string
  /**
   * Nulo: a base de origem não tem endereço fiscal — a coluna "ENDEREÇO
   * COBRANÇA" da planilha guarda e-mail, conferido nas sete abas (R10 do PRD).
   * Vazio e explícito, nunca uma string em branco fingindo endereço.
   */
  enderecoFiscal: null
}

export interface ClienteRejeitado {
  documentoBruto: string
  razaoSocial: string
  motivo: string
}

const soDigitos = (s: string) => (s ?? '').replace(/\D/g, '')

/**
 * dados/clientes.csv usa ponto-e-vírgula e traz BOM na primeira coluna.
 * Colunas: cnpj_cpf;tipo;razao_social;contato;email_cobranca;empresas_contratadas;
 *          qtd_linhas;primeira_data;ultima_data
 *
 * A base NÃO tem telefone, e-mail de assinatura nem endereço fiscal. Esses três
 * ficam vazios e o Comercial os digita no primeiro pedido do cliente. Preenchê-los
 * por dedução violaria RN7.
 */
export function lerClientes(caminhoCsv: string): {
  validos: NovoCliente[]
  rejeitados: ClienteRejeitado[]
} {
  const texto = fs.readFileSync(caminhoCsv, 'utf8').replace(/^﻿/, '')
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== '')
  const cabecalho = linhas[0].split(';').map((c) => c.trim())

  const iDoc = cabecalho.indexOf('cnpj_cpf')
  const iTipo = cabecalho.indexOf('tipo')
  const iRazao = cabecalho.indexOf('razao_social')
  const iContato = cabecalho.indexOf('contato')
  const iEmail = cabecalho.indexOf('email_cobranca')

  const validos: NovoCliente[] = []
  const rejeitados: ClienteRejeitado[] = []
  const vistos = new Set<string>()

  for (const linha of linhas.slice(1)) {
    const c = linha.split(';')
    const doc = soDigitos(c[iDoc])
    const razaoSocial = (c[iRazao] ?? '').trim()

    if (doc.length !== 11 && doc.length !== 14) {
      rejeitados.push({
        documentoBruto: (c[iDoc] ?? '').trim(),
        razaoSocial,
        motivo: `Documento com ${doc.length} dígitos — CPF tem 11 e CNPJ tem 14. Não se completa por dedução.`,
      })
      continue
    }
    if (vistos.has(doc)) continue
    vistos.add(doc)

    const contato = (c[iContato] ?? '').trim()

    validos.push({
      cnpjCpf: doc,
      tipo: (c[iTipo] ?? '').trim() === 'PF' ? 'PF' : 'PJ',
      razaoSocial,
      contato,
      contatoIncompleto: contato.split(/\s+/).filter(Boolean).length < 2,
      emailFinanceiro: (c[iEmail] ?? '').trim(),
      emailAssinatura: '',
      telefone: '',
      enderecoFiscal: null,
    })
  }

  return { validos, rejeitados }
}
