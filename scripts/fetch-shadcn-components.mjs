import https from 'https'
import fs from 'fs'
import path from 'path'

const components = process.argv.slice(2)
const base = 'https://ui.shadcn.com/r/styles/base-nova/'

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

function adapt(content) {
  return content.replace(/@\/registry\/base-nova\//g, '@/')
}

for (const name of components) {
  const json = await fetch(`${base}${name}.json`)
  for (const file of json.files) {
    const outPath = path.join('src/components/ui', path.basename(file.path))
    fs.writeFileSync(outPath, adapt(file.content))
    console.log('Wrote', outPath)
  }
}
