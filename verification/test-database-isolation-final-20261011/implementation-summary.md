# 测试数据库隔离最终核验 · 实施总结

> 执行时间：2026-10-11｜模式：核验 + 最小修复

---

## 1. 实际生效的测试数据库及验证依据

**结论：测试实际连接 `geek_price_test`（已证实）。**

验证依据（非仅看注解声明）：

| 验证项 | 方法 | 结果 |
|---|---|---|
| Spring 运行时解析的 JDBC URL | 新增 `DataSourceUrlIsolationTest`：断言 `HikariDataSource.getJdbcUrl()` 包含 `/geek_price_test`，且不含 `/geek_price?` | ✅ 通过（运行时实证） |
| Environment 解析的 `spring.datasource.url` | 同一测试断言 `env.getProperty("spring.datasource.url")` 指向测试库 | ✅ 通过 |
| 环境变量覆盖风险 | 检查 `SPRING_DATASOURCE_URL/USERNAME/PASSWORD/SPRING_PROFILES_ACTIVE` | ✅ 均未设置，无覆盖风险 |
| 配置优先级 | `application-test.yml` 仅在 `test` profile 激活时叠加生效；主配置指向开发库 `geek_price`，demo 配置不含 datasource | ✅ 互不干扰 |

`DataSourceUrlIsolationTest` 为本轮新增的唯一测试类，输出中对连接串做了密码脱敏。

## 2. Profile 与配置覆盖风险

| 检查项 | 结果 |
|---|---|
| 16 个测试类是否全部带 `@ActiveProfiles("test")` | ✅ **16/16**（逐文件复查；首次统计 13 是 PowerShell `**` 递归通配符的假象） |
| `IsolatedIntegrationTest.java` 基类使用情况 | **无任何类继承**（各测试类已各自带注解，基类属冗余） → 已删除，避免误导 |
| 测试配置是否可能覆盖开发/演示配置 | 不会：profile 未激活时不加载对应 yml；开发（无 profile）与 demo 均不加载 `application-test.yml` |
| 是否存在动态数据源/辅助脚本改写连接 | 未发现；数据源为 Spring Boot 默认单数据源 + Hikari |
| Maven 配置是否注入数据源参数 | 未发现相关 `-Dspring.datasource` 参数 |

## 3. ProductSyncSchedulerTest 核验

✅ 已通过 Mockito 隔离：`@MockBean ProductDataSyncService` + `@MockBean ValueScoreService`，
6 个用例全部验证调度器行为（enabled/mockEnabled 开关、cron 占位符、重算触发），
**不调用真实同步链路、不写入任何数据库**。本轮重跑 6/6 通过。

## 4. 实际修改的文件

| 文件 | 改动 |
|---|---|
| `src/test/java/com/geekprice/DataSourceUrlIsolationTest.java` | **新增**：运行时 JDBC URL 隔离实证测试 |
| `src/test/java/com/geekprice/IsolatedIntegrationTest.java` | **删除**：无继承者的冗余基类 |

配置文件（`application-test.yml`、16 个测试类注解）经核验**无需修改**——配置本身正确，本轮补齐的是"证明其生效"的实证手段。

## 5. 执行的测试命令与结果

| 命令 | 结果 |
|---|---|
| `mvn test -Dtest=DataSourceUrlIsolationTest,ProductSyncSchedulerTest,DemoSyncGuardTest` | **10/10 通过**（隔离实证 + 调度器 mock + demo 拦截） |
| `mvn test`（全量） | **110/110 通过，BUILD SUCCESS** |

## 6. 开发库前后核验结果

| 指标 | 全量测试前 | 全量测试后 | 结论 |
|---|---|---|---|
| products | 132 | 132 | ✅ |
| product_images | 179 | 179 | ✅ |
| product_image_license | 47 | 47 | ✅ |
| product_source | 0 | 0 | ✅ |
| product_prices | 404 | 404 | ✅ |
| price_history | 14040 | 14040 | ✅ |
| users | 6 | 6 | ✅ |

**开发库 geek_price 前后完全一致，无测试写入污染。**

测试库 geek_price_test 状态：132/179/0（sources=0 为测试前基线复制值，`ProductSyncSchedulerTest` 已 mock 不再写入；其余集成测试的 `@Transactional` 回滚覆盖库内写入）。

## 7. 三个独立结论

1. **配置检查**：通过——16/16 测试类激活 test profile，无环境变量/脚本覆盖风险，demo 与开发配置不受测试影响。
2. **测试通过**：通过——全量 110/110，BUILD SUCCESS。
3. **数据库无污染**：证实——运行时 JDBC URL 指向 geek_price_test（实证测试）；开发库 7 项关键指标前后完全一致。

## 8. 尚未解决的问题

1. **测试库为开发库的手工快照**：开发库 schema 变更后需人工重建 `geek_price_test`（重建脚本为临时脚本，已随临时目录清理；如需保留可按报告方法重做：`CREATE TABLE ... LIKE` + `INSERT ... SELECT` 逐表复制，仅操作测试库，永不 DROP 开发库）。
2. **测试库中的数据会随测试运行累积**（`@Transactional` 只回滚连接内事务，独立事务仍写入测试库）——不影响开发库，仅测试库数据漂移；如需纯净可定期重建快照。
