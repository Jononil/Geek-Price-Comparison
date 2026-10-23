package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductSpec;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductSpecMapper;
import com.geekprice.provider.ProductDataProvider;
import com.geekprice.provider.dto.ExternalProductDTO;
import com.geekprice.provider.dto.ExternalProductResponse;
import com.geekprice.provider.standardizer.ProductStandardizer;
import com.geekprice.service.ProductDataSyncService;
import com.geekprice.service.dto.SyncResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 商品数据同步服务实现。
 *
 * 编排流程：
 * 1. 按平台编码解析 platforms 记录（不硬编码平台 ID）；
 * 2. 分页拉取 Provider 数据（每页 20 条，直到不足一页）；
 * 3. 现有商品一次性加载为「身份 Key -&gt; Product」索引，避免逐商品查询（N+1）；
 * 4. 逐商品交给 {@link ProductSyncWriter} 落库（每个商品一个事务）；
 * 5. Provider 失败 / 单商品失败只记录，不中断其他平台、不删除本地已有数据。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductDataSyncServiceImpl implements ProductDataSyncService {

    /** 每页拉取数量：分页请求直到返回不足一页为止 */
    private static final int PAGE_SIZE = 20;

    private final List<ProductDataProvider> providers;
    private final PlatformMapper platformMapper;
    private final ProductMapper productMapper;
    private final ProductSpecMapper productSpecMapper;
    private final ProductStandardizer standardizer;
    private final ProductSyncWriter syncWriter;
    private final BrandCategoryResolver resolver;
    private final com.geekprice.config.ProductSyncProperties syncProperties;

    /** 单机 JVM 级同步锁：防止定时同步与手动同步并发执行（不引入 Redis/Quartz 等分布式设施） */
    private final ReentrantLock syncLock = new ReentrantLock();

    /**
     * 演示环境保护：product.sync.mock-enabled=false 时（如 demo Profile），
     * 后端在服务层直接拦截所有 Mock 数据源同步（定时与手动一并拦截），
     * 返回明确的业务异常而非伪装成功。
     * 注意：该守卫只约束 Mock 数据源；接入真实数据源后，真实 Provider 应绕过此开关。
     */
    private void guardMockSyncAllowed() {
        if (!syncProperties.isMockEnabled()) {
            log.warn("演示环境策略拦截：product.sync.mock-enabled=false，已拒绝 Mock 数据同步");
            throw new com.geekprice.exception.BusinessException(
                    com.geekprice.common.ResultCode.FORBIDDEN.getCode(),
                    "演示环境已禁用 Mock 数据同步（product.sync.mock-enabled=false），未执行任何数据写入");
        }
    }

    @Override
    public SyncResult syncAll() {
        guardMockSyncAllowed();
        if (!syncLock.tryLock()) {
            return busyResult(null);
        }
        try {
            return doSyncAll();
        } finally {
            syncLock.unlock();
        }
    }

    /** 全平台同步核心逻辑（调用方须先获取 {@link #syncLock}） */
    private SyncResult doSyncAll() {
        Map<String, Product> index = loadExistingProductIndex();
        int total = 0;
        int success = 0;
        int fail = 0;
        int skip = 0;
        int providerOk = 0;
        int providerFail = 0;
        for (ProductDataProvider provider : providers) {
            try {
                SyncResult r = syncProvider(provider, index);
                total += r.getTotal();
                success += r.getSuccessCount();
                fail += r.getFailCount();
                skip += r.getSkipCount();
                if (r.getFailCount() > 0) {
                    providerFail++;
                } else {
                    providerOk++;
                }
            } catch (Exception e) {
                // Provider 级严重异常：只记录并跳过，不影响其他平台
                fail++;
                providerFail++;
                log.error("平台 {} 同步异常，已跳过", provider.platformCode(), e);
            }
        }
        SyncResult aggregate = new SyncResult();
        aggregate.setTotal(total);
        aggregate.setSuccessCount(success);
        aggregate.setFailCount(fail);
        aggregate.setSkipCount(skip);
        aggregate.setSyncTime(LocalDateTime.now());
        aggregate.setMessage(String.format("全量同步完成：%d 个数据源（成功 %d 失败 %d），商品成功 %d 失败 %d 跳过 %d",
                providers.size(), providerOk, providerFail, success, fail, skip));
        log.info("全量同步完成 total={} success={} fail={} skip={}", total, success, fail, skip);
        return aggregate;
    }

    @Override
    public SyncResult syncPlatform(String platformCode) {
        guardMockSyncAllowed();
        if (!syncLock.tryLock()) {
            return busyResult(platformCode);
        }
        try {
            return doSyncPlatform(platformCode);
        } finally {
            syncLock.unlock();
        }
    }

    /** 单平台同步核心逻辑（调用方须先获取 {@link #syncLock}） */
    private SyncResult doSyncPlatform(String platformCode) {
        ProductDataProvider provider = providers.stream()
                .filter(p -> p.platformCode().equals(platformCode))
                .findFirst()
                .orElse(null);
        if (provider == null) {
            SyncResult result = new SyncResult();
            result.setPlatformCode(platformCode);
            result.setSyncTime(LocalDateTime.now());
            result.setFailCount(1);
            result.setMessage("未找到平台对应的数据源 Provider：" + platformCode);
            log.warn(result.getMessage());
            return result;
        }
        try {
            return syncProvider(provider, loadExistingProductIndex());
        } catch (Exception e) {
            log.error("平台 {} 同步异常", platformCode, e);
            SyncResult result = new SyncResult();
            result.setPlatformCode(platformCode);
            result.setSyncTime(LocalDateTime.now());
            result.setFailCount(1);
            result.setMessage("平台 " + platformCode + " 同步异常：" + e.getMessage());
            return result;
        }
    }

    /** 并发保护：已有同步任务在执行时返回 busy 结果，不阻塞调用方 */
    private SyncResult busyResult(String platformCode) {
        SyncResult result = new SyncResult();
        result.setPlatformCode(platformCode);
        result.setBusy(true);
        result.setSyncTime(LocalDateTime.now());
        result.setMessage("同步任务正在进行中，请稍后再试");
        log.warn("同步任务正在执行中，本次请求被并发保护拒绝 platform={}", platformCode);
        return result;
    }

    /** 执行单个平台的同步 */
    private SyncResult syncProvider(ProductDataProvider provider, Map<String, Product> index) {
        String code = provider.platformCode();
        SyncResult result = new SyncResult();
        result.setPlatformCode(code);
        result.setSyncTime(LocalDateTime.now());

        Platform platform = platformMapper.selectOne(
                new LambdaQueryWrapper<Platform>().eq(Platform::getCode, code));
        if (platform == null) {
            result.setFailCount(1);
            result.setMessage("平台编码未在 platforms 表注册：" + code);
            log.warn(result.getMessage());
            return result;
        }

        // 分页拉取全量商品；拉取失败时 fetchAll 已把失败原因写入 result 并返回 null
        List<ExternalProductDTO> all = fetchAll(provider, code, result);
        if (all == null) {
            return result;
        }

        result.setTotal(all.size());
        String providerName = "MOCK_" + code.toUpperCase(Locale.ROOT);
        int success = 0;
        int fail = 0;
        int skip = 0;
        for (ExternalProductDTO dto : all) {
            // 必要字段校验：externalId / 型号（商品名称）缺失则无法建立商品身份，跳过而非失败
            if (!isValidForSync(dto)) {
                skip++;
                log.warn("跳过商品（缺少必要字段） platform={} externalId={} brand={} model={}",
                        code, dto == null ? null : dto.getExternalProductId(),
                        dto == null ? null : dto.getBrand(), dto == null ? null : dto.getModel());
                continue;
            }
            try {
                syncWriter.syncOneProduct(dto, platform, providerName, index);
                success++;
            } catch (Exception e) {
                // 商品级异常：只记录该商品，继续同步其余商品
                fail++;
                log.error("同步商品失败 platform={} externalId={} name={} 原因={}",
                        code, dto.getExternalProductId(), safeName(dto), e.getMessage());
            }
        }
        result.setSuccessCount(success);
        result.setFailCount(fail);
        result.setSkipCount(skip);
        result.setMessage(String.format("平台 %s 同步完成：成功 %d，失败 %d，跳过 %d", code, success, fail, skip));
        log.info("平台 {} 同步完成 total={} success={} fail={} skip={}", code, all.size(), success, fail, skip);
        return result;
    }

    /** 分页拉取平台全量商品；拉取失败返回 null 并把失败原因写入 result */
    private List<ExternalProductDTO> fetchAll(ProductDataProvider provider, String code, SyncResult result) {
        List<ExternalProductDTO> all = new ArrayList<>();
        int page = 1;
        while (true) {
            ExternalProductResponse resp;
            try {
                resp = provider.fetchProducts(page, PAGE_SIZE);
            } catch (Exception e) {
                result.setFailCount(1);
                result.setMessage("平台 " + code + " 数据源请求异常，已保留本地已有数据");
                log.warn("平台 {} 第 {} 页拉取异常", code, page, e);
                return null;
            }
            if (resp == null) {
                // 数据源返回 null 响应：视为「本次无有效数据」，记录 warning，不视为失败、不删除已有数据
                log.warn("平台 {} 数据源返回 null 响应，视为本次无有效同步数据", code);
                break;
            }
            if (resp.getCode() == null || resp.getCode() != 200) {
                // Provider 失败（超时/限流/认证失败/服务器错误等）：记录并结束该平台，不删除任何已有数据
                result.setFailCount(1);
                result.setMessage(String.format("平台 %s 数据源拉取失败 code=%s，已保留本地已有数据", code, resp.getCode()));
                log.warn("平台 {} 第 {} 页拉取失败 code={}，跳过该平台", code, page, resp.getCode());
                return null;
            }
            List<ExternalProductDTO> data = resp.getData();
            if (data == null || data.isEmpty()) {
                break;
            }
            all.addAll(data);
            if (data.size() < PAGE_SIZE) {
                break;
            }
            page++;
        }
        return all;
    }

    /**
     * 必要字段校验：externalId 与型号（商品名称）任一缺失都无法建立商品身份，应跳过而非失败。
     * brand / category / price 等可选字段缺失不影响同步（brandId / categoryId 保持 null，价格缺失跳过报价）。
     */
    private boolean isValidForSync(ExternalProductDTO dto) {
        if (dto == null) {
            return false;
        }
        if (dto.getExternalProductId() == null || dto.getExternalProductId().isBlank()) {
            return false;
        }
        return dto.getModel() != null && !dto.getModel().isBlank();
    }

    /** 拼装商品名用于日志（品牌 + 型号），null 安全 */
    private String safeName(ExternalProductDTO dto) {
        if (dto == null) {
            return null;
        }
        String brand = dto.getBrand() == null ? "" : dto.getBrand().trim();
        String model = dto.getModel() == null ? "" : dto.getModel().trim();
        if (brand.isEmpty()) {
            return model;
        }
        return model.isEmpty() ? brand : brand + " " + model;
    }

    /**
     * 一次性加载现有商品为身份索引（normalizedKey -&gt; Product），并批量预取规格，
     * 避免同步过程中逐商品查询（N+1）。
     */
    private Map<String, Product> loadExistingProductIndex() {
        Map<String, Product> index = new HashMap<>();
        List<Product> all = productMapper.selectList(null);
        if (all == null || all.isEmpty()) {
            return index;
        }
        Map<Long, Map<String, String>> specsByProduct = new HashMap<>();
        List<ProductSpec> specs = productSpecMapper.selectList(null);
        if (specs != null) {
            for (ProductSpec spec : specs) {
                specsByProduct.computeIfAbsent(spec.getProductId(), k -> new HashMap<>())
                        .put(spec.getSpecKey(), spec.getSpecValue());
            }
        }
        for (Product product : all) {
            String key = buildProductIdentityKey(product, specsByProduct.get(product.getId()));
            if (key != null) {
                index.putIfAbsent(key, product);
            }
        }
        return index;
    }

    /**
     * 由系统 Product 重建标准身份 Key。
     *
     * 品牌来源不再依赖 name 首词，而是优先用 brandId 反查基础表品牌名：
     * - 有 brandId：brand = brands.name，model = 完整 name，由 normalizeModel 大小写不敏感地剔除品牌前缀，
     *   因此即使 name 里是「Apple」而基础表是「苹果」，也能重建出与 {@code buildIdentityKey(dto)} 一致的 Key；
     * - 无 brandId（未知品牌）：回退 name 首词，保证未知品牌商品仍可跨平台去重。
     */
    private String buildProductIdentityKey(Product product, Map<String, String> specs) {
        if (product == null || product.getName() == null) {
            return null;
        }
        String name = product.getName().trim();
        String brand = resolver.brandName(product.getBrandId());
        String model;
        if (brand != null && !brand.isBlank()) {
            model = name;
        } else {
            int space = name.indexOf(' ');
            brand = space > 0 ? name.substring(0, space) : name;
            model = space > 0 ? name.substring(space + 1).trim() : "";
        }
        ExternalProductDTO pseudo = new ExternalProductDTO();
        pseudo.setBrand(brand);
        pseudo.setModel(model);
        pseudo.setSpecs(specs == null ? Map.of() : specs);
        return standardizer.buildIdentityKey(pseudo).getNormalizedKey();
    }
}
