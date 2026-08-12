import fs from 'node:fs'

const texto = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const linha of texto.split('\n')) {
  const [chave, ...resto] = linha.split('=')
  if (chave && resto.length) process.env[chave.trim()] = resto.join('=').trim()
}
