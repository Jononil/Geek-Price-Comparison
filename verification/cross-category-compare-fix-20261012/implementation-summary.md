# 修复商品跨品类对比问题 · 实施总结

> 执行时间：2026-10-12

---

## 1. 修改的文件及作用

| 文件 | 改动 |
|---|---|
| `backend/.../service/impl/ProductServiceImpl.java` | `compare()` 方法重写：批量查询 + 分类一致性校验（Service 层强制拦截） |
| `frontend/src/store/compare.ts` | `addProduct()` 增加跨品类校验 + `ElMessage` 中文提示 |
| `frontend/src/components/ProductCard.vue` | 移除 `addCompare` 中重复的失败提示（store 内部已处理） |
| `frontend/src/views/ProductDetailView.vue` | 同上 |
| `backend/.../service/ProductCompareCategoryTest.java` | **新增**：12 个针对性测试 |
| `backend/.../service/ProductSearchCompareTest.java` | 修改 `multiProductCompareReturnsDetails`：改用同品类商品对比 |

---

## 2. 可比较品类判定规则

**保守策略：仅允许同一具体分类（`category_id` 相等）的商品进行规格对比。**

依据：
- `categories` 表 16 个分类全部 `parent_id=0`（无父子结构）
- 各分类参数体系差异大（手机 vs 鼠标 vs 显示器），不存在安全的"可比较品类"映射关系
- 不修改分类表，不批量迁移商品

---

## 3. 前后端如何拦截跨品类对比

### 后端（`ProductServiceImpl.compare()`）
```java
// 批量查询，走逻辑删除过滤（selectList 而非 selectBatchIds）
List<Product> products = productMapper.selectList(
        new LambdaQueryWrapper<Product>().in(Product::getId, ids));
Long categoryRef = null;
for (Product p : products) {
    if (p.getStatus() == null || p.getStatus() != 1) continue; // 不存在/已下架跳过
    if (categoryRef == null) {
        categoryRef = p.getCategoryId();
    } else if (!categoryRef.equals(p.getCategoryId())) {
        throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                "商品规格对比仅支持同一品类，当前商品分类不一致");
    }
    // ...
}
```

**关键点**：
- 在 `fillProductForDetail()` 之前完成分类校验（防止绕过前端直接调 API）
- 使用 `selectList`（走 `@TableLogic` 过滤）而非 `selectBatchIds`（原生 SQL 不过滤）
- 批量查询 `IN` 避免 N+1
- 统一返回 `ResultCode.PARAM_ERROR`（400）

### 前端（`store/compare.ts`）
```typescript
if (products.value.length > 0) {
  const first = products.value[0]
  if (first.categoryId && product.categoryId && first.categoryId !== product.categoryId) {
    ElMessage.error('请选择相同品类的商品进行对比')
    return false
  }
}
```

**调用方（`ProductCard.vue` / `ProductDetailView.vue`）**：仅在成功时显示 `ElMessage.success('已加入对比')`，失败时由 store 内部 `ElMessage` 提示具体原因（重复/上限/跨品类）。

---

## 4. 跨平台比价如何保证不受影响

跨平台比价走完全不同的接口链：
- **商品规格对比**：`GET /api/products/compare?ids=1,2` → `ProductController.compare()` → `ProductServiceImpl.compare()`（本次修改）
- **跨平台比价**：`GET /api/prices/compare/{productId}` → `PriceController.compare()` → `PriceServiceImpl.compare()`（未修改）

两者 Controller、Service、SQL 均独立，无交叉调用。本次修改不触碰 `PriceController`、`PriceServiceImpl`、`product_prices` 表、Mock 数据源或同步服务。

---

## 5. 测试命令与结果

### 新增测试（`ProductCompareCategoryTest`）
| 测试 | 覆盖场景 |
|---|---|
| `compareSameCategoryDifferentModels` | 同品类不同型号对比成功 |
| `compareSameCategoryDifferentBrands` | 同品类不同品牌对比成功 |
| `comparePhoneAndMouseRejected` | 手机与鼠标混合对比被拒绝 |
| `compareLaptopAndHeadphoneRejected` | 笔记本与耳机混合对比被拒绝 |
| `directApiCallCrossCategoryRejected` | 直接调用后端接口跨品类仍被拒绝 |
| `compareSkipsNonExistentProducts` | 不存在的商品 ID 被跳过 |
| `compareDeduplicatesProductIds` | 重复商品 ID 被去重 |
| `compareWithMissingSpecsDoesNotFabricate` | 规格缺失不伪造数据 |
| `crossPlatformPriceCompareUnaffected` | 跨平台比价不受影响 |
| `productListUnaffected` | 商品列表不回归 |
| `compareSkipsLogicallyDeletedProducts` | 逻辑删除商品被跳过 |
| `compareSkipsUnlistedProducts` | 下架商品被跳过 |

### 执行结果
| 测试 | 命令 | 结果 |
|---|---|---|
| 后端全量测试（124 个） | `mvn test -DargLine=-Djdk.attach.allowAttachSelf=true` | ✅ **124/124 通过，BUILD SUCCESS** |
| 新增对比测试 | `mvn test -Dtest=ProductCompareCategoryTest` | ✅ **12/12 通过** |
| 修复后搜索对比测试 | `mvn test -Dtest=ProductSearchCompareTest` | ✅ **7/7 通过** |
| 用户端 `vue-tsc` + `npm run build` | `npx vue-tsc -b --force && npm run build` | ✅ exit 0 / ✓ built in 9.66s |
| 管理端 `vue-tsc` + `npm run build` | 同上 | ✅ exit 0 / ✓ built in 9.32s |

### 数据库连接确认
后端测试连接 `geek_price_test`（独立测试库），开发库 `geek_price` 未被写入。

---

## 6. 未解决的问题

无。所有 12 个测试通过，124 个全量测试通过，双端构建成功，跨平台比价功能不受影响。
