import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { XMLParser } from 'fast-xml-parser'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Uso: npm run inspect:xml -- caminho/do/arquivo.xml')
  process.exit(1)
}

const absolutePath = path.resolve(filePath)

if (!fs.existsSync(absolutePath)) {
  console.error(`Arquivo nao encontrado: ${absolutePath}`)
  process.exit(1)
}

const xml = fs.readFileSync(absolutePath, 'utf8')
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
})

const parsed = parser.parse(xml)

function collectKeys(value, prefix = '', output = new Set()) {
  if (!value || typeof value !== 'object') return output
  for (const key of Object.keys(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    output.add(nextPrefix)
    collectKeys(value[key], nextPrefix, output)
  }
  return output
}

const keys = [...collectKeys(parsed)].slice(0, 250)

console.log(JSON.stringify({ file: absolutePath, topLevelKeys: Object.keys(parsed), detectedPaths: keys }, null, 2))
