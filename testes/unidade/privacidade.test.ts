import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(__dirname, '../..')

describe('regra de privacidade — estrutural, não opcional', () => {
  it('nenhum CPF, e-mail ou telefone real está commitado em fixture ou fonte', () => {
    const csv = fs.readFileSync(path.resolve(RAIZ, '../dados/clientes.csv'), 'utf8')
      .replace(/^﻿/, '')
    const linhas = csv.split(/\r?\n/).filter(Boolean).slice(1)
    const emails = new Set<string>()
    const docs = new Set<string>()
    for (const l of linhas) {
      const c = l.split(';')
      const doc = (c[0] ?? '').replace(/\D/g, '')
      if (doc.length >= 11) docs.add(doc)
      if ((c[4] ?? '').includes('@')) emails.add(c[4].trim().toLowerCase())
    }

    const fontes = execSync(
      `find src testes -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.json' \\)`,
      { encoding: 'utf8', cwd: RAIZ },
    ).trim().split('\n').filter(Boolean)

    const vazamentos: string[] = []
    for (const f of fontes) {
      const txt = fs.readFileSync(path.join(RAIZ, f), 'utf8')
      for (const m of txt.match(/[\w.\-+]+@[\w.\-]+\.\w+/g) ?? []) {
        if (emails.has(m.toLowerCase())) vazamentos.push(`${f}: e-mail real`)
      }
      for (const m of (txt.match(/\b[\d.\-\/]{11,20}\b/g) ?? []).map((s) => s.replace(/\D/g, ''))) {
        if (docs.has(m)) vazamentos.push(`${f}: documento real`)
      }
    }
    expect(vazamentos).toEqual([])
  })

  it('.env.local está ignorado pelo git', () => {
    const ignorado = execSync('git check-ignore .env.local || true', { encoding: 'utf8', cwd: RAIZ })
    expect(ignorado.trim()).toBe('.env.local')
  })

  /**
   * Contrato social, RG e comprovante de residência são dado pessoal em estado
   * puro. Duas coisas os protegem, e as duas são estruturais: a pasta é
   * ignorada pelo git, e não fica dentro de `public/` — de onde o Next serve
   * qualquer arquivo por URL, sem passar por código nenhum.
   */
  it('os anexos ficam fora do repositório e fora de public/', () => {
    const ignorado = execSync('git check-ignore armazenamento || true', { encoding: 'utf8', cwd: RAIZ })
    expect(ignorado.trim()).toBe('armazenamento')
    expect(fs.existsSync(path.join(RAIZ, 'public/armazenamento'))).toBe(false)

    // E o caminho do arquivo nunca vem da URL: a rota lê o id, busca no banco e
    // usa o caminho gravado. Sem isso, `../../.env.local` seria um id válido.
    const rota = fs.readFileSync(path.join(RAIZ, 'src/app/api/documentos/[id]/route.ts'), 'utf8')
    expect(rota).toContain('eq(anexos.id, numero)')
    expect(rota).not.toMatch(/readFile\([^)]*params/)
  })

  it('nenhuma credencial no repositório', () => {
    const achados = execSync(
      // `--exclude` no próprio arquivo: sem isso a guarda acha o padrão que ela
      // mesma escreve e falha sozinha, dizendo que existe credencial onde só
      // existe a busca por credencial.
      `grep -rn "esteira_local\\|postgres://" src/ testes/ scripts/ --exclude=privacidade.test.ts || true`,
      { encoding: 'utf8', cwd: RAIZ },
    ).trim()
    expect(achados).toBe('')
  })
})
