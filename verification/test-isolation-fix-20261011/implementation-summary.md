# 测试数据污染修复 · 实施总结

> 执行时间：2026-10-11

---

## 1. 根因分析

`ProductSyncSchedulerTest` 的测试 1/5/6 直接调用真实 `syncService.syncAll()` / `syncPlatform("jd")`，触发完整 Mock 同步链路（Provider → Standardizer → Writer），最终由 `ProductSyncWriter.syncOneProduct()` 写入数据库。

`ProductSyncWriter.syncOneProduct()` 标注 `@Transactional(rollbackFor = Exception.class)`，默认传播行为 REQUIRED。在测试事务内，它加入外层事务；但由于 `ProductDataSyncServiceImpl` 使用 `ReentrantLock` 作为 JVM 级并发保护，锁的获取/释放时机与事务边界不一致，导致外层事务回滚时无法覆盖 Writer 的独立写入。

**根本原因**：测试不应执行真实同步链路；应使用 Mock 验证调度器行为。

## 2. 修复方案

### 2.1 ProductSyncSchedulerTest 重写（Mockito）

将测试 1/5/6 从"调用真实同步"改为"Mock 验证调度器是否调用 syncService"：

```java
@MockBean
private ProductDataSyncService syncService;
@MockBean
private ValueScoreService valueScoreService;

@Test
void scheduledSyncRunsWhenEnabled() {
    properties.setEnabled(true);
    properties.setMockEnabled(true);
    when(syncService.syncAll()).thenReturn(okResult());
    scheduler.scheduledSync();
    verify(syncService, times(1)).syncAll();
    verify(valueScoreService, times(1)).recalculateAll();
}

@Test
void scheduledSyncSkipsWhenDisabled() {
    properties.setEnabled(false);
    scheduler.scheduledSync();
    verify(syncService, never()).syncAll();
}

@Test
void scheduledSyncSkipsWhenMockDisabled() {
    properties.setEnabled(true);
    properties.setMockEnabled(false);
    scheduler.scheduledSync();
    verify(syncService, never()).syncAll();
}
```

### 2.2 测试数据库隔离

创建专用测试数据库 `geek_price_test`（完整复制开发库结构 + 数据），所有测试类添加 `@ActiveProfiles("test")` 注解，自动连接测试库。

- 新增：`backend/src/test/resources/application-test.yml`（JDBC URL 指向 `geek_price_test`）
- 新增：`backend/src/test/java/com/geekprice/IsolatedIntegrationTest.java`（基类，提供 profile 配置）
- 修改：16 个测试类全部添加 `@ActiveProfiles("test")`

### 2.3 JDBC 编码修正

`application-test.yml` 的 JDBC URL 中 `characterEncoding=utf8mb4` 改为 `characterEncoding=utf8`（MySQL Connector/J 不接受 `utf8mb4`）。

## 3. 数据库前后对比

### 测试前快照（开发库 geek_price）
```
products=132 images=179 licenses=47 sources=0 prices=404 history=14040 users=6
```

### 测试后快照（开发库 geek_price）
```
products=132 images=179 licenses=47 sources=0 prices=404 history=14040 users=6
```

### 结论
**开发库完全无污染**，所有指标与基线完全一致。

### 测试库快照（geek_price_test）
```
products=132 images=179 licenses=47 sources=0 prices=404 history=14040 users=6
```

测试库也未产生新数据（`ProductSyncSchedulerTest` 已 mock，其他测试的 `@Transactional` 回滚覆盖了测试库内的写入）。

## 4. 测试执行结果

| 测试 | 结果 |
|---|---|
| `mvn test` 全量（109 个测试） | **109/109 通过，BUILD SUCCESS** |
| `DemoSyncGuardTest`（3 个测试） | 3/3 通过 |
| `ProductSyncSchedulerTest`（6 个测试） | 6/6 通过 |
| `ProductDataSyncServiceTest`（7 个测试） | 7/7 通过 |
| `ProductImagePriceSyncTest`（9 个测试） | 9/9 通过 |

## 5. 修改的关键文件

| 文件 | 改动 |
|---|---|
| `ProductSyncSchedulerTest.java` | 重写为 Mockito mock，不再调用真实同步 |
| `application-test.yml` | 新增：测试库 JDBC 配置（utf8mb4 → utf8） |
| `IsolatedIntegrationTest.java` | 新增：测试基类（提供 @ActiveProfiles("test")） |
| 16 个测试类 | 添加 `@ActiveProfiles("test")` 注解 |

## 6. 剩余风险

1. **测试库需手动重建**：如果开发库 schema 变更，需重新运行 `create_test_db.mjs` 同步到测试库。
2. **`ProductSyncWriter.syncOneProduct()` 的事务传播未修改**（按规则保留生产事务语义），但测试已隔离，不再触发污染。
3. **8 个受同步影响的商品报价/历史价格保持现状**（无快照，按规则不擅自恢复）。
