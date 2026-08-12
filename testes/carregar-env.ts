import fs from 'node:fs'
import path from 'node:path'

// Resolvido por `process.cwd()`, e não por `import.meta.url`: o Vitest carrega
// este arquivo como ESM e o Playwright carrega a config dele como CJS, onde
// `import.meta` nem existe. Os dois rodam com a raiz do projeto como cwd.
const arquivo = path.resolve(process.cwd(), '.env.local')
const texto = fs.readFileSync(arquivo, 'utf8')

for (const linha of texto.split('\n')) {
  const [chave, ...resto] = linha.split('=')
  if (chave && resto.length) process.env[chave.trim()] = resto.join('=').trim()
}
