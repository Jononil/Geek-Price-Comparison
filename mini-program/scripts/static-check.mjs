/**
 * 静态交叉校验脚本（阶段六）
 * ---------------------------------------------------------------
 * 目的：在无微信开发者工具的环境下，尽可能提前发现"编译通过但运行报错"的
 *      三类常见问题：
 *      1. WXML 绑定的事件处理器在对应 Page/Component TS 中不存在；
 *      2. wx.navigateTo/switchTab/redirectTo/reLaunch 的目标页面未在
 *         app.json 注册，或对 tab 页误用 navigateTo（运行时直接失败）；
 *      3. WXML 使用的自定义组件未在该页 json 的 usingComponents 注册，
 *         或注册的组件目录缺文件。
 *
 * 运行：node scripts/static-check.mjs（纯静态，不需要后端）
 * 退出码：0=全部通过，1=有失败。
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let pass = 0
let fail = 0
const failures = []

function ok(name, cond, detail = '') {
  if (cond) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    failures.push(`${name}${detail ? '  (' + detail + ')' : ''}`)
    console.log(`  FAIL  ${name}${detail ? '  (' + detail + ')' : ''}`)
  }
}

function read(p) {
  return readFileSync(join(ROOT, p), 'utf8')
}

/** 递归收集某目录下所有文件（排除 node_modules） */
function walk(dir, ext, out = []) {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return out
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules') continue
    const full = join(abs, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(join(dir, name), ext, out)
    else if (!ext || name.endsWith(ext)) out.push(join(dir, name).replace(/\\/g, '/'))
  }
  return out
}

// ---------- 0. app.json 基础 ----------
console.log('--- 0. app.json 与页面文件 ---')
const app = JSON.parse(read('app.json'))
const pages = app.pages
const tabPages = app.tabBar.list.map((t) => t.pagePath)
ok('pages 全部有 4 件套', pages.every((p) =>
  ['.ts', '.wxml', '.json', '.wxss'].every((e) => existsSync(join(ROOT, p + e)))),
`共 ${pages.length} 页`)
ok('tabBar 页均在 pages 中', tabPages.every((t) => pages.includes(t)))
ok('gp-no-image 已全局注册', 'gp-no-image' in app.usingComponents)

// ---------- 1. 事件处理器 ↔ TS 方法 ----------
console.log('--- 1. WXML 事件处理器 ↔ TS 方法 ---')
// 收集所有 bind/catch 事件属性值（含 bind:retry 形式）
const EVENT_RE = /\b(?:bind|catch)[:]?([a-zA-Z]+)\s*=\s*"([a-zA-Z_][a-zA-Z0-9_]*)"/g

let missingHandlers = []
for (const wxmlPath of walk('', '.wxml')) {
  const tsPath = wxmlPath.replace(/\.wxml$/, '.ts')
  if (!existsSync(join(ROOT, tsPath))) continue
  const wxml = read(wxmlPath)
  const ts = read(tsPath)
  const handlers = new Set()
  let m
  while ((m = EVENT_RE.exec(wxml)) !== null) handlers.add(m[2])
  // 组件文件中的 triggerEvent 由父页 bind:xx 处理——父页 TS 需有方法
  for (const h of handlers) {
    // 方法定义形如 "  methodName(" 或 "async methodName(" 或 "  methodName:"
    const defRe = new RegExp(`\\b${h}\\s*[:(]`)
    if (!defRe.test(ts)) missingHandlers.push(`${wxmlPath} → ${h}`)
  }
}
ok('全部 WXML 事件处理器在 TS 中有定义', missingHandlers.length === 0,
  missingHandlers.join('; '))

// ---------- 2. 跳转目标 ↔ 注册页面 ----------
console.log('--- 2. 跳转 URL ↔ 注册页面 ---')
const NAV_RE = /wx\.(navigateTo|switchTab|redirectTo|reLaunch)\(\s*\{\s*url:\s*[`'"]([^`'"?]+)/g
let badNavs = []
for (const tsPath of walk('', '.ts')) {
  if (tsPath.startsWith('scripts/')) continue
  const ts = read(tsPath)
  let m
  while ((m = NAV_RE.exec(ts)) !== null) {
    const [, method, rawUrl] = m
    const url = rawUrl.trim()
    if (!url.startsWith('/pages/')) continue // 动态拼接的跳过（如 template literal 前缀）
    const target = url.slice(1)
    if (!pages.includes(target)) {
      badNavs.push(`${tsPath}: ${method} → ${target} 未注册`)
      continue
    }
    // tab 页必须 switchTab；非 tab 页不得 switchTab
    if (tabPages.includes(target) && method !== 'switchTab') {
      badNavs.push(`${tsPath}: ${method} → tab页 ${target} 应使用 switchTab`)
    }
    if (!tabPages.includes(target) && method === 'switchTab') {
      badNavs.push(`${tsPath}: switchTab → 非tab页 ${target}`)
    }
  }
}
ok('全部静态跳转目标合法', badNavs.length === 0, badNavs.join('; '))

// login.ts 的动态回跳：手工业务校验（tabPages 列表存在）
const loginTs = read('pages/login/login.ts')
ok('login.ts 含 tab 页分流逻辑', loginTs.includes('switchTab') && loginTs.includes('redirectTo'))

// ---------- 3. 自定义组件注册 ↔ 文件 ----------
console.log('--- 3. 组件引用 ↔ 注册/文件 ---')
let badComponents = []
for (const jsonPath of walk('', '.json')) {
  if (jsonPath === 'app.json' || jsonPath.startsWith('scripts/') || jsonPath.includes('package')) continue
  const json = JSON.parse(read(jsonPath))
  const using = json.usingComponents || {}
  // 页面 wxml + 组件 wxml 中使用的自定义标签
  const wxmlPath = jsonPath.replace(/\.json$/, '.wxml')
  if (!existsSync(join(ROOT, wxmlPath))) continue
  const wxml = read(wxmlPath)
  const usedTags = new Set()
  const tagRe = /<(gp-[a-z-]+)/g
  let m
  while ((m = tagRe.exec(wxml)) !== null) usedTags.add(m[1])
  for (const tag of usedTags) {
    const compPath = using[tag]
    if (!compPath) {
      // 可能来自 app.json 全局注册
      if (!(tag in app.usingComponents)) {
        badComponents.push(`${wxmlPath}: <${tag}> 未注册`)
      } else if (!existsSync(join(ROOT, app.usingComponents[tag] + '.json'))) {
        badComponents.push(`${wxmlPath}: <${tag}> 全局组件缺文件`)
      }
      continue
    }
    if (!existsSync(join(ROOT, compPath + '.json'))) {
      badComponents.push(`${jsonPath}: ${tag} → ${compPath} 缺文件`)
    }
  }
}
ok('全部自定义组件已注册且文件齐全', badComponents.length === 0, badComponents.join('; '))

// ---------- 4. JSON 合法性（UTF-8） ----------
console.log('--- 4. JSON 合法性 ---')
let badJson = []
for (const jsonPath of walk('', '.json')) {
  if (jsonPath.includes('package-lock') || jsonPath.includes('node_modules')) continue
  try {
    JSON.parse(read(jsonPath))
  } catch (e) {
    badJson.push(`${jsonPath}: ${e.message.slice(0, 40)}`)
  }
}
ok('全部项目 JSON 可解析', badJson.length === 0, badJson.join('; '))

// ---------- 5. WXML 模板表达式保守性（无函数调用） ----------
console.log('--- 5. WXML 模板表达式（禁函数调用） ---')
const FUNC_CALLS = []
for (const wxmlPath of walk('', '.wxml')) {
  const wxml = read(wxmlPath)
  // {{ ... xxx( ... ) }} 中出现 "(" 即视为函数调用（WXML 不支持）
  const exprRe = /\{\{([^}]*)\}\}/g
  let m
  while ((m = exprRe.exec(wxml)) !== null) {
    if (m[1].includes('(')) FUNC_CALLS.push(`${wxmlPath}: {{${m[1].slice(0, 30)}}}`)
  }
}
ok('WXML 表达式无函数调用', FUNC_CALLS.length === 0, FUNC_CALLS.join('; '))

// ---------- 汇总 ----------
console.log(`\n===== 静态校验结果：PASS ${pass} / FAIL ${fail} =====`)
if (fail > 0) {
  failures.forEach((f) => console.log(`  - ${f}`))
  process.exit(1)
}
process.exit(0)
