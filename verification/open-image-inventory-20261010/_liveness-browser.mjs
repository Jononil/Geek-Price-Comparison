/** 用真实浏览器验证 47 张已存图片的存活（绕开 curl 429 限流） */
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
await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
await c.send('Page.navigate', { url: 'file:///' + join(OUT, '_ro/liveness.html').replace(/\\/g, '/') })
await sleep(30000) // 47 张原图，充分等待

const got = JSON.parse(await c.eval(`(() => JSON.stringify([...document.querySelectorAll('img')].map((i, k) => ({ k, ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth, h: i.naturalHeight }))))()`))
const result = rows.map((r, i) => ({ ...r, ...(got[i] ?? { ok: false, w: 0, h: 0 }) }))
const okN = result.filter((r) => r.ok).length
console.log(`浏览器验证：可加载 ${okN} / ${result.length}`)
const bad = result.filter((r) => !r.ok)
if (bad.length) { console.log('❌ 未加载：'); bad.forEach((b) => console.log(`   #${b.productId} ${b.url.slice(0, 90)}`)) }
writeFileSync(join(OUT, '_ro/url-liveness-browser.json'), JSON.stringify(result, null, 2))
process.exit(0)
