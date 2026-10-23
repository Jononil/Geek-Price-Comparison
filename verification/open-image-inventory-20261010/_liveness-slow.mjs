/** 慢速顺序验证：逐张加载（间隔 4 秒），区分 429 限流与真实失效 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const OUT = 'E:/第三学期/Geek Price Comparison/verification/open-image-inventory-20261010'
const rows = JSON.parse(readFileSync(join(OUT, '_ro/liveness-rows.json'), 'utf8'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map() }
  static async connect(u) {
    const ws = new WebSocket(u)
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')) })
    const c = new Cdp(ws)
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && c.p.has(m.id)) { const q = c.p.get(m.id); c.p.delete(m.id); m.error ? q.reject(new Error(JSON.stringify(m.error))) : q.resolve(m.result) } }
    return c
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.p.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); reject(new Error('timeout')) } }, 30000) }) }
  async eval(e) { const r = await this.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.value }
}
try { await fetch('http://127.0.0.1:9222/json/version') } catch { console.error('CDP 未启动'); process.exit(1) }
const t = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json()
const c = await Cdp.connect(t.webSocketDebuggerUrl)
await c.send('Page.enable'); await c.send('Runtime.enable')

// 先打开空页建立 fetch 上下文
await c.send('Page.navigate', { url: 'about:blank' })
await sleep(1500)

console.log(`慢速逐张验证 ${rows.length} 张，间隔 4 秒（约 ${Math.round(rows.length * 4.5 / 60)} 分钟）...`)
const result = []
for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  const js = `(async () => { try { const resp = await fetch(${JSON.stringify(r.url)}, { method: 'GET', headers: { 'Accept': 'image/*' } }); return resp.status + '|' + resp.headers.get('content-type'); } catch (e) { return 'ERR|' + e.message; } })()`
  let out = 'ERR|timeout'
  for (let a = 0; a < 3; a++) {
    try { out = await c.eval(js); if (!String(out).startsWith('ERR') && !out.startsWith('429')) break } catch { }
    await sleep(15000) // 429 时等 15 秒重试
  }
  const [status, ct] = String(out).split('|')
  const ok = status === '200'
  result.push({ ...r, status, contentType: ct, ok })
  console.log(`  [${String(i + 1).padStart(2)}/${rows.length}] ${ok ? '✅' : '❌'} #${String(r.productId).padEnd(4)} ${status} ${String(ct ?? '').slice(0, 12)}`)
  await sleep(4000)
}
const okN = result.filter((x) => x.ok).length
console.log(`\n慢速验证结果：可访问 ${okN} / ${result.length}`)
writeFileSync(join(OUT, '_ro/url-liveness-slow.json'), JSON.stringify(result, null, 2))
