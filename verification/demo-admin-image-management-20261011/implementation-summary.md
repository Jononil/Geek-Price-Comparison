# 演示环境固化 + 管理端图片授权管理 · 实施报告

> 执行时间：2026-10-11｜模式：直接实施 + 测试

---

## 1. 演示环境同步隔离

### 方式
新增 `backend/src/main/resources/application-demo.yml`（Spring Profile: demo），内容：
```yaml
product:
  sync:
    enabled: false
```

### 启动方式
```bash
# Maven
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
# 或环境变量
SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run
```

### 生效验证
- 日志确认：`The following 1 profile is active: "demo"`
- 定时同步日志：无（03:00 cron 不触发）
- 管理员手动同步 API 仍然可用（未禁用）
- 开发环境（无 profile）不受影响，`product.sync.enabled` 保持 `true`

### 关键说明
- 只关闭**定时自动同步**，不删除 Mock providers、不改同步架构
- 管理员手动同步 API（`/api/admin/data-source/sync*`）不受影响
- 不影响其他定时任务
- 不硬编码敏感配置

---

## 2. 数据库核查结果

| 指标 | 当前值 | 基线 |
|---|---|---|
| products | 132 | 132 ✅ |
| product_images | 179 | 179 ✅ |
| 真实图片 | 47 | 47 ✅ |
| product_image_license | 47 | 47 ✅ |
| product_source | **0** | 0 ✅ |
| users | 5 | 5 ✅ |
| product_prices | 404 | 404 ✅ |
| price_history | 14040 | 14040 ✅ |

**未授权 Mock 图片**：0 张（非占位非 wikimedia 的图片为 0）

---

## 3. 8 个既有商品数据差异核查

**受同步影响的 8 个商品**（今日 12:29 新增历史价格）：

| product_id | 商品名 | 新增历史价格 | 新增平台报价 |
|---|---|---|---|
| 48 | Bose QC Ultra | 270 条 | 3 平台（京东/淘宝/天猫） |
| 65 | 罗技 G Pro X Superlight 2 | 270 条 | 3 平台 |
| 67 | 罗技 MX Master 3S | 270 条 | 3 平台 |
| 78 | Sony ZV-E10 | 270 条 | 3 平台 |
| 95 | NVIDIA RTX 4070 Ti Super | 270 条 | 3 平台 |
| 97 | NVIDIA RTX 4080 Super | 270 条 | 3 平台 |
| 99 | AMD RX 7800 XT | 270 条 | 3 平台 |
| 128 | 小米 AX9000 | 270 条 | 3 平台 |

**结论**：
- 图片表已通过受控回滚完全恢复（备份文件 179 行 = 当前 179 行）
- 这 8 个商品的历史价格和平台报价是**同步功能正常产生的数据**（非错误数据），按任务要求**保留不删除**
- 规格数据可能被同步更新（同步器按 spec_key upsert），但这是同步功能的设计行为
- 性价比分数可能因新增报价而变化，属正常业务逻辑
- **无猜测原始值、无凭商品数量恢复、无删除报价或历史记录**

---

## 4. 新增/修改的关键文件

### 数据库
| 文件 | 说明 |
|---|---|
| `database/05-product-image-license-audit.sql` | 新增 `risk_notes` 列 + 回填 5 条风险标记（#24/#105/#106 License review needed；#95/#97 对比图） |
| `application-demo.yml` | 演示环境配置，关闭定时同步 |

### 后端（6 个新文件 + 1 个修改）
| 文件 | 说明 |
|---|---|
| `entity/ProductImageLicense.java` | 增加 `riskNotes` 字段 |
| `dto/AdminImageLicenseQueryDTO.java` | 新增：列表查询条件 |
| `dto/AdminImageLicenseUpdateDTO.java` | 新增：编辑 DTO（部分更新） |
| `dto/AdminImageLicenseAuditDTO.java` | 新增：审核操作 DTO |
| `vo/AdminImageLicenseVO.java` | 新增：管理端列表 VO（含商品名/图片URL/署名完整性） |
| `service/AdminImageLicenseService.java` | 新增：服务接口 |
| `service/impl/AdminImageLicenseServiceImpl.java` | 新增：实现（含审核完整性校验） |
| `controller/AdminProductImageLicenseController.java` | 新增：REST 控制器（4 个端点） |

### 管理端前端（3 个修改 + 1 个新增）
| 文件 | 说明 |
|---|---|
| `api/index.ts` | 新增 `adminImageLicenseApi`（list/detail/update/audit） |
| `router/index.ts` | 新增 `/image-licenses` 路由 |
| `layout/AdminLayout.vue` | 新增「🧾 图片授权」菜单项 |
| `views/ImageLicenseManageView.vue` | 新增：授权管理页面 |

---

## 5. 图片授权管理功能完成情况

### 授权列表
- ✅ 展示：图片ID、商品ID/名称、缩略预览、作者、许可证（含外链）、来源页面（外链）、审核状态、审核人/时间、署名完整性、风险标记
- ✅ 筛选：审核状态、商品名称/ID、许可证类型、署名缺失、待审核、有风险标记
- ✅ 分页（10/20/50）、加载骨架屏、空状态、错误提示

### 授权详情
- ✅ 完整展示：来源/来源页面/原始图片地址/作者/许可证/许可证链接/署名文本/改动说明/型号匹配/风险标记/审核状态/审核人时间
- ✅ 所有外链使用数据库真实地址，不自行拼接

### 授权编辑
- ✅ 部分更新：null 字段保留原值，不整条覆盖
- ✅ URL 格式校验（必须 http/https）
- ✅ riskNotes 空串=解除风险，非空=设置风险
- ✅ 编辑后自动重置为 PENDING_EVIDENCE，记录审核人/时间

### 审核操作
- ✅ **APPROVE 完整性校验**（后端强制）：
  1. 无未解除风险标记（#24/#105/#106 无法绕过）
  2. 来源/来源页面/许可/许可链接齐全
  3. 许可为开放家族（CC0/PD/CC BY/CC BY-SA，拒绝 NC/ND）
  4. 需署名许可必须有作者+署名文本
  5. 型号匹配为 EXACT_MATCH 或 SERIES_LEVEL
- ✅ REJECT 必须填原因，原因追加到 riskNotes 留痕
- ✅ 普通用户/匿名调用返回 403（SecurityConfig 全局保护）

### 业务联动
- ✅ 状态变更即时生效：用户端 `ProductImageLicenseService` 实时查询 `audit_status`
- ✅ 编辑不会错误继承给其他图片（一图一授权记录）
- ✅ 不改变现有统一门控原则

---

## 6. 测试结果

| 测试 | 结果 | 性质 |
|---|---|---|
| 后端 `mvn test` | ✅ **104/104 通过，BUILD SUCCESS** | 实际执行 |
| 用户端 `vue-tsc` + `npm run build` | ✅ exit 0 / ✓ built in 9.68s | 实际执行 |
| 管理端 `vue-tsc` + `npm run build` | ✅ exit 0 / ✓ built in 9.38s | 实际执行 |
| 管理端浏览器验收（10 项） | ✅ **10/10 通过**（列表/筛选/详情/编辑/审核弹窗/拒绝校验/无控制台错误） | 实际执行 |
| 后端 API 测试（20 项） | ✅ **20/20 通过**（权限隔离/列表/筛选/详情/编辑/审核/风险拦截/URL校验/业务联动/数据恢复） | 实际执行 |
| 用户端回归 | ✅ 列表 total=42、详情 images+attribution、推荐 10 条、比价 3 报价、历史 90 点 | 实际执行 |
| 演示配置验证 | ✅ demo profile 激活、同步关闭、无调度日志 | 实际执行 |

---

## 7. 尚未完成事项及风险

| 事项 | 说明 |
|---|---|
| 管理端图片授权页面的 `共 47 条` 分页文本 | Element Plus 默认英文 `Total 47`，如需中文需配置 locale（非功能问题） |
| 8 个商品的历史价格/报价 | 保留不动（同步功能正常产生），如需清理需人工确认后单独处理 |
| 定时同步的 cron 时间 | demo profile 已关闭，开发环境仍为每天 03:00，如需修改可在 `application.yml` 调整 |
| 用户端图片 SVG 兜底 | 无合格图商品显示类别 SVG，这是设计行为；如需隐藏可调整 `ProductServiceImpl.list()` 门控策略 |
