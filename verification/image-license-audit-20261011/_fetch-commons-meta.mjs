#!/usr/bin/env node
/**
 * 阶段 B-1 第二步：批量核验 47 张图在 Wikimedia Commons 的授权元数据
 * 依据：MediaWiki API extmetadata 是授权一手证据（非二手转述）。
 * 只读网络请求，不写库。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'E:/第三学期/Geek Price Comparison/verification/image-license-audit-20261011'
const worklist = JSON.parse(readFileSync(join(OUT, '_raw/images-worklist.json'), 'utf8'))
const UA = 'GeekPriceGraduationProject/1.0 (stage B-1 license audit; read-only)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const FILTER = 'ImageDescription|ObjectName|Categories|Artist|LicenseShortName|LicenseUrl|Credit|DateTimeOriginal|Restrictions|AttributionRequired|Copyrighted|UsageTerms|Permission|License'

async function fetchBatch(titles) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mime', iiextmetadatafilter: FILTER,
    titles: titles.join('|')
  })
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
      if (r.status === 429) { console.log('  429 限流，等待 25s 重试...'); await sleep(25000); continue }
      if (!r.ok) { console.log(`  HTTP ${r.status}，重试...`); await sleep(8000); continue }
      return await r.json()
    } catch (e) { console.log('  fetch 失败:', e.message, '重试...'); await sleep(8000) }
  }
  return null
}

const titles = worklist.map((w) => w.commonsFileTitle).filter(Boolean)
console.log(`待核验文件 ${titles.length} 个，分批查询...`)
const results = {}
for (let i = 0; i < titles.length; i += 25) {
  const batch = titles.slice(i, i + 25)
  console.log(`  批次 ${i / 25 + 1}（${batch.length} 个文件）...`)
  const j = await fetchBatch(batch)
  if (!j) { console.log('  ❌ 批次失败'); continue }
  const clean = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  for (const [, page] of Object.entries(j.query?.pages ?? {})) {
    const ii = page.imageinfo?.[0] ?? {}
    const em = ii.extmetadata ?? {}
    results[page.title] = {
      missing: page.missing === '',
      title: page.title,
      originalUrl: ii.url, width: ii.width, height: ii.height, mime: ii.mime, size: ii.size,
      licenseShortName: clean(em.LicenseShortName?.value),
      licenseUrl: clean(em.LicenseUrl?.value),
      artist: clean(em.Artist?.value),
      credit: clean(em.Credit?.value),
      description: clean(em.ImageDescription?.value),
      objectName: clean(em.ObjectName?.value),
      categories: clean(em.Categories?.value),
      usageTerms: clean(em.UsageTerms?.value),
      restrictions: clean(em.Restrictions?.value),
      attributionRequired: clean(em.AttributionRequired?.value),
      copyrighted: clean(em.Copyrighted?.value),
      permission: clean(em.Permission?.value).slice(0, 300)
    }
  }
  await sleep(3500)
}
writeFileSync(join(OUT, '_raw/commons-meta.json'), JSON.stringify(results, null, 2))
const okN = Object.values(results).filter((r) => !r.missing).length
console.log(`\n核验返回：${okN} / ${titles.length} 个文件有元数据`)
const licTally = {}
for (const r of Object.values(results)) { if (r.missing) continue; licTally[r.licenseShortName || '(空)'] = (licTally[r.licenseShortName || '(空)'] ?? 0) + 1 }
console.log('LicenseShortName 分布：')
Object.entries(licTally).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(30)} ${v}`))
