/**
 * 接口冒烟回归脚本（阶段六）
 * ---------------------------------------------------------------
 * 用途：用小程序各页面真实使用的参数组合直调后端接口，验证
 *      响应结构与页面数据绑定假设一致（字段存在性、空值形态、
 *      分页、认证拦截等）。可在后端启动后随时重复执行：
 *
 *      node scripts/smoke-test.mjs
 *
 * 原则：
 * - 只读为主；唯一写操作 = 登录测试账号的浏览历史上报（POST /history/1，
 *   后端对该用户同商品先删后插，幂等，不污染其他数据）；
 * - 不修改任何数据库/后端文件；
 * - 退出码 0=全部通过，1=有失败（便于 CI 接入）。
 */

const BASE = process.env.API_BASE || 'http://localhost:8080'
const ACCOUNT = { username: 'user', password: '123456' }

let pass = 0
let fail = 0
const failures = []

function ok(name, cond, detail = '') {
  if (cond) {
    pass++
    console.log(`  PASS  ${name}${detail ? '  (' + detail + ')' : ''}`)
  } else {
    fail++
    failures.push(name)
    console.log(`  FAIL  ${name}${detail ? '  (' + detail + ')' : ''}`)
  }
}

async function get(path, token) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { headers })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, body }
}

async function post(path, payload, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, body }
}

/** 详情接口字段存在性断言（页面绑定依赖） */
function assertProductShape(p, label) {
  ok(`${label}: 必要字段存在`, p && typeof p.id === 'number' && typeof p.name === 'string')
  ok(
    `${label}: valueScore 可为 null（页面按"数据不足"处理）`,
    p && ('valueScore' in p) && (p.valueScore === null || typeof p.valueScore === 'number')
  )
  ok(
    `${label}: performanceScore 可为 null`,
    p && ('performanceScore' in p) &&
      (p.performanceScore === null || typeof p.performanceScore === 'number')
  )
  ok(`${label}: images 为数组（可为空）`, Array.isArray(p.images))
  ok(`${label}: imagesAttribution 为数组`, Array.isArray(p.imagesAttribution))
}

async function main() {
  console.log(`\n===== 冒烟回归：${BASE} =====\n`)

  // ---------- 0. 服务可达 ----------
  console.log('--- 0. 服务可达 ---')
  const cats = await get('/api/categories')
  ok('服务可达 /api/categories', cats.status === 200 && cats.body?.code === 200)
  ok('分类 16 条', Array.isArray(cats.body?.data) && cats.body.data.length === 16,
    `实际 ${cats.body?.data?.length}`)

  // ---------- 1. 首页 ----------
  console.log('--- 1. 首页 ---')
  const value = await get('/api/products?sort=valueScore&page=1&pageSize=8')
  ok('高性价比 8 条', value.body?.code === 200 && value.body.data.records.length === 8,
    `total=${value.body?.data?.total}`)
  ok('列表项含 brandName/categoryName', typeof value.body?.data?.records[0]?.brandName === 'string')
  ok('列表项 specs 为 null（页面不依赖）', value.body?.data?.records[0]?.specs === null)

  const recs = await get('/api/recommendations')
  ok('推荐 10 条', recs.body?.code === 200 && recs.body.data.length === 10)
  const recTypes = new Set(recs.body.data.map((r) => r.type))
  ok('推荐 type ∈ {value,hot,hybrid}',
    [...recTypes].every((t) => ['value', 'hot', 'hybrid'].includes(t)),
    [...recTypes].join(','))
  ok('推荐 image 可为 null（页面空态）',
    recs.body.data.every((r) => r.image === null || typeof r.image === 'string'))

  // ---------- 2. 商品列表/分类/搜索 ----------
  console.log('--- 2. 商品列表/分类/搜索 ---')
  const listAll = await get('/api/products?page=1&pageSize=20')
  const totalVisible = listAll.body?.data?.total
  ok('默认列表 total=109（图片可见性过滤后）', totalVisible === 109, `实际 ${totalVisible}`)

  const search = await get('/api/products?keyword=iPhone&page=1&pageSize=20')
  ok('搜索 iPhone 有结果', search.body?.code === 200 && search.body.data.total > 0,
    `total=${search.body?.data?.total}`)

  const filtered = await get('/api/products?categoryId=1&minPrice=1000&maxPrice=8000&page=1&pageSize=20')
  ok('分类+价格区间过滤生效', filtered.body?.code === 200 && filtered.body.data.total > 0,
    `total=${filtered.body?.data?.total}`)

  const page2 = await get('/api/products?sort=heat&page=2&pageSize=20')
  ok('第 2 页非空', page2.body?.code === 200 && page2.body.data.records.length > 0)

  const capped = await get('/api/products?page=1&pageSize=999')
  ok('pageSize 超限截断为 50', capped.body?.data?.pageSize === 50)

  const brands = await get('/api/brands')
  ok('品牌 60 条', brands.body?.code === 200 && brands.body.data.length === 60)

  // ---------- 3. 商品详情 ----------
  console.log('--- 3. 商品详情 ---')
  const d1 = await get('/api/products/1')
  ok('详情 id=1 code=200', d1.body?.code === 200)
  assertProductShape(d1.body?.data, 'id=1')
  const specs1 = d1.body?.data?.specs || []
  ok('id=1 参数含 verifyStatus 三态字段',
    specs1.every((s) => ['verified', 'reference', 'template', null, undefined].includes(s.verifyStatus)))
  const att1 = (d1.body?.data?.imagesAttribution || [])[0]
  ok('id=1 署名含 author/license 字段', att1 && 'author' in att1 && 'license' in att1)

  const d13 = await get('/api/products/13')
  ok('id=13 valueScore=null（数据不足，不伪造）', d13.body?.data?.valueScore === null)
  ok('id=13 参数全为 template（不可信口径）',
    (d13.body?.data?.specs || []).every((s) => s.verifyStatus === 'template'))

  const d404 = await get('/api/products/999999')
  ok('不存在商品 → HTTP200 + code=404', d404.status === 200 && d404.body?.code === 404)

  // ---------- 4. 价格 ----------
  console.log('--- 4. 多平台比价与历史 ---')
  const pc = await get('/api/prices/compare/1')
  ok('报价 code=200 且 prices 为数组', pc.body?.code === 200 && Array.isArray(pc.body?.data?.prices))
  ok('报价含 updatedAt（页面显示更新时间）',
    pc.body.data.prices.every((p) => 'updatedAt' in p))
  ok('lowestPrice/saveAmount 字段存在',
    'lowestPrice' in pc.body?.data && 'saveAmount' in pc.body?.data)

  const ph = await get('/api/prices/history/1')
  ok('历史 code=200 且 history 为数组', ph.body?.code === 200 && Array.isArray(ph.body?.data?.history))
  ok('历史统计字段齐全',
    ['currentLowest', 'historyLowest', 'historyHighest'].every((k) => k in ph.body?.data))

  const phEmpty = await get('/api/prices/history/999999')
  ok('无历史 → history=[] + 统计 0（页面空状态，不画曲线）',
    phEmpty.body?.data?.history?.length === 0 && phEmpty.body?.data?.historyLowest === 0)

  // ---------- 5. 对比 ----------
  console.log('--- 5. 商品对比 ---')
  const cmpSame = await get('/api/products/compare?ids=1,45536')
  ok('同品类对比 code=200 + 2 条', cmpSame.body?.code === 200 && cmpSame.body.data.length === 2)
  ok('compare 返回 specs 全量（页面渲染参数表）',
    (cmpSame.body?.data?.[0]?.specs || []).length > 0)

  const cmpCross = await get('/api/products/compare?ids=1,13')
  ok('跨品类对比被服务端拒绝 code=400（红线）', cmpCross.body?.code === 400,
    cmpCross.body?.message?.slice(0, 30))

  // ---------- 6. 测评/评价 ----------
  console.log('--- 6. 测评/评价 ---')
  const arts = await get('/api/articles?page=1&pageSize=10')
  ok('测评列表 code=200', arts.body?.code === 200)
  ok('测评含 cover/productId 字段（可为 null）',
    arts.body.data.records.every((a) => 'cover' in a && 'productId' in a))

  const art1 = await get('/api/articles/1')
  ok('测评详情 code=200 + content 富文本', art1.body?.code === 200 && typeof art1.body?.data?.content === 'string')
  ok('测评详情含 pros/cons/score 字段',
    ['pros', 'cons', 'score'].every((k) => k in art1.body?.data))

  const rv = await get('/api/reviews/product/1?page=1&pageSize=10')
  ok('评价分页 code=200 + total', rv.body?.code === 200 && typeof rv.body?.data?.total === 'number')
  ok('评价含 nickname（页面显示）', 'nickname' in (rv.body?.data?.records?.[0] || {}))

  // ---------- 7. 认证链路 ----------
  console.log('--- 7. 认证链路 ---')
  const login = await post('/api/auth/login', ACCOUNT)
  ok('登录成功 code=200', login.body?.code === 200)
  const token = login.body?.data?.token
  ok('返回 token + user', typeof token === 'string' && !!login.body?.data?.user?.id)

  const badLogin = await post('/api/auth/login', { username: 'user', password: 'wrong' })
  ok('错误密码 → code=401（页面 toast"用户名或密码错误"）', badLogin.body?.code === 401)

  const info = await get('/api/user/info', token)
  ok('带 token 访问 /user/info code=200', info.body?.code === 200)

  const infoNoAuth = await get('/api/user/info')
  ok('无 token 访问 /user/info → HTTP 403（Security 层）', infoNoAuth.status === 403)

  const fav = await get('/api/favorites?page=1&pageSize=10', token)
  ok('收藏列表（带 token）code=200', fav.body?.code === 200)

  const his = await get('/api/history?limit=20', token)
  ok('浏览历史（带 token）code=200', his.body?.code === 200)

  const hisNoAuth = await post('/api/history/1', null)
  ok('无 token 上报浏览 → HTTP 403', hisNoAuth.status === 403)

  const rvNoAuth = await post('/api/reviews', { productId: 1, star: 5, content: 'x' })
  ok('无 token 发表评价 → code=401（Service 层业务拦截）', rvNoAuth.body?.code === 401)

  const pwdWrong = await fetch(`${BASE}/api/user/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ oldPassword: '__smoke_wrong__', newPassword: '123456' }),
  }).then((r) => r.json())
  ok('错误旧密码改密 → code=400（不改数据）', pwdWrong.code === 400)

  // 唯一写操作：测试账号自身浏览历史上报（幂等）
  const record = await post('/api/history/1', null, token)
  ok('带 token 上报浏览历史 code=200', record.body?.code === 200)

  // ---------- 汇总 ----------
  console.log(`\n===== 结果：PASS ${pass} / FAIL ${fail} =====`)
  if (fail > 0) {
    console.log('失败项：')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error('脚本异常：', e.message)
  process.exit(1)
})
