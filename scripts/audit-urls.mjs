import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/data/current-site.generated.ts', import.meta.url), 'utf8')
const pagesJson = /export const currentSitePages: CurrentSitePage\[\] = ([\s\S]*)$/.exec(source)?.[1]
const skippedJson = /export const skippedCurrentSiteUrls = ([\s\S]*?) as const/.exec(source)?.[1]

if (!pagesJson) throw new Error('Could not find currentSitePages in generated data')

const currentSitePages = JSON.parse(pagesJson)
const skipped = skippedJson ? JSON.parse(skippedJson) : []

const totals = currentSitePages.reduce((acc, page) => {
  acc[page.kind] = (acc[page.kind] ?? 0) + 1
  return acc
}, {})

console.log(JSON.stringify({ total: currentSitePages.length, totals, skipped }, null, 2))
