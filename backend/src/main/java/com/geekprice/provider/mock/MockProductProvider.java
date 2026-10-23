package com.geekprice.provider.mock;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geekprice.provider.ProductDataProvider;
import com.geekprice.provider.dto.ExternalPriceDTO;
import com.geekprice.provider.dto.ExternalProductDTO;
import com.geekprice.provider.dto.ExternalProductResponse;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Mock Provider 抽象基类。
 *
 * 封装三个平台 Mock Provider（京东/淘宝/天猫）的公共逻辑：
 * 1. 启动时从 classpath:/mock-data/products.json 加载本平台视角的商品目录到内存；
 * 2. 模拟外部 API 的网络延迟与异常模式（只返回错误响应，不真正抛出异常）；
 * 3. 提供 search / getDetail / fetchProducts 的公共实现，子类无需重复。
 *
 * 子类只需实现 getPlatformCode() 与 getProviderName()。
 * 未来接入真实平台时，用 HTTP 调用替换本类的数据来源即可，核心业务无需重写。
 */
public abstract class MockProductProvider implements ProductDataProvider {

    // ===== 可配置项（Step 8 将改为 @ConfigurationProperties 从 application.yml 读取） =====
    private boolean delayEnabled = true;
    private long minDelayMs = 100;
    private long maxDelayMs = 500;
    // 故障模式：SUCCESS / TIMEOUT / RATE_LIMIT / UNAUTHORIZED / FORBIDDEN / NOT_FOUND /
    //          SERVER_ERROR / BAD_GATEWAY / SERVICE_UNAVAILABLE / CONNECTION_ERROR / NULL_RESPONSE / EMPTY
    private String errorMode = "SUCCESS";
    /** 单商品字段故障注入（Step 8/11/12 测试用）：NONE / NULL_MODEL / NULL_EXTERNAL_ID / NULL_BRAND / NULL_CATEGORY / NULL_PRICE / NEGATIVE_PRICE / LONG_NAME / NULL_IMAGES / EMPTY_IMAGES / BAD_IMAGES / NULL_HISTORY / CUSTOM_HISTORY */
    private String corruptMode = "NONE";
    private int historyDays = 90;

    /** 「无故障模拟」哨兵：区分「返回 null 响应」与「无需模拟、走真实数据」 */
    private static final ExternalProductResponse NO_FAULT = new ExternalProductResponse();

    /** 各品类价格波动幅度（用于生成真实感历史价格） */
    private static final Map<String, Double> VOLATILITY = Map.ofEntries(
            Map.entry("手机", 0.03),
            Map.entry("平板", 0.03),
            Map.entry("笔记本电脑", 0.05),
            Map.entry("CPU", 0.08),
            Map.entry("显卡", 0.10),
            Map.entry("显示器", 0.04),
            Map.entry("耳机", 0.05),
            Map.entry("键盘", 0.04),
            Map.entry("鼠标", 0.04),
            Map.entry("相机", 0.06),
            Map.entry("智能手表", 0.05),
            Map.entry("移动硬盘", 0.03),
            Map.entry("路由器", 0.04),
            Map.entry("游戏设备", 0.05)
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 本平台视角的商品目录（启动时加载一次，常驻内存） */
    private List<ExternalProductDTO> catalog = new ArrayList<>();

    @PostConstruct
    public void init() {
        this.catalog = loadCatalog();
    }

    /** 复位内存目录（Step 8 测试用：字段篡改后恢复原始数据） */
    public void resetCatalog() {
        this.catalog = loadCatalog();
    }

    /** 子类返回平台编码（jd / taobao / tmall），与 platforms.code 一致 */
    protected abstract String getPlatformCode();

    /** 子类返回 Provider 名称（MOCK_JD / MOCK_TAOBAO / MOCK_TMALL） */
    protected abstract String getProviderName();

    @Override
    public String platformCode() {
        return getPlatformCode();
    }

    @Override
    public ExternalProductResponse search(String keyword, int page, int pageSize) {
        simulateDelay();
        ExternalProductResponse fault = simulateFailure();
        return fault != NO_FAULT ? fault : doSearch(keyword, page, pageSize);
    }

    @Override
    public ExternalProductResponse getDetail(String externalProductId) {
        simulateDelay();
        ExternalProductResponse fault = simulateFailure();
        return fault != NO_FAULT ? fault : doGetDetail(externalProductId);
    }

    @Override
    public ExternalProductResponse fetchProducts(int page, int pageSize) {
        simulateDelay();
        ExternalProductResponse fault = simulateFailure();
        return fault != NO_FAULT ? fault : doFetchProducts(page, pageSize);
    }

    // ---------- 公共查询实现（子类直接复用） ----------

    /** 关键词搜索：匹配商品名 / 品牌 / 型号 / 分类 */
    protected ExternalProductResponse doSearch(String keyword, int page, int pageSize) {
        String kw = keyword == null ? "" : keyword.trim().toLowerCase();
        List<ExternalProductDTO> matched = catalog.stream()
                .filter(p -> kw.isEmpty() || matches(p, kw))
                .collect(Collectors.toList());
        return paging(matched, page, pageSize);
    }

    /** 按外部商品 ID 查详情，未找到返回 404 */
    protected ExternalProductResponse doGetDetail(String externalProductId) {
        ExternalProductDTO found = catalog.stream()
                .filter(p -> p.getExternalProductId().equals(externalProductId))
                .findFirst().orElse(null);
        if (found == null) {
            return build(404, "商品不存在", null, 0);
        }
        return build(200, "success", List.of(found), 1);
    }

    /** 全量分页拉取（定时同步使用） */
    protected ExternalProductResponse doFetchProducts(int page, int pageSize) {
        applyCorruption();
        return paging(catalog, page, pageSize);
    }

    /** 对目录首个商品做字段篡改（Step 8 测试用），模拟缺失 / 非法字段 */
    private void applyCorruption() {
        String mode = corruptMode == null ? "NONE" : corruptMode.trim().toUpperCase();
        if ("NONE".equals(mode) || catalog.isEmpty()) {
            return;
        }
        ExternalProductDTO first = catalog.get(0);
        switch (mode) {
            case "NULL_MODEL" -> first.setModel(null);
            case "NULL_EXTERNAL_ID" -> first.setExternalProductId(null);
            case "NULL_BRAND" -> first.setBrand(null);
            case "NULL_CATEGORY" -> first.setCategory(null);
            case "NULL_PRICE" -> first.setPrice(null);
            case "NEGATIVE_PRICE" -> first.setPrice(new BigDecimal("-100"));   // 负数价格，模拟非法报价
            case "LONG_NAME" -> first.setModel("X".repeat(300));   // 型号超长导致 name 超过 VARCHAR(200) 而抛异常
            case "NULL_IMAGES" -> first.setImages(null);                         // 图片缺失
            case "EMPTY_IMAGES" -> first.setImages(List.of());                   // 图片为空列表
            case "BAD_IMAGES" -> first.setImages(Arrays.asList(                   // 含 null / 空白 / 重复 的异常图片（Arrays.asList 允许 null 元素）
                    "https://cdn.example.com/dup.jpg", null, "   ",
                    "https://cdn.example.com/dup.jpg", "/images/products/step11-valid.svg"));
            case "NULL_HISTORY" -> first.setPriceHistory(null);                   // 历史价格缺失
            case "CUSTOM_HISTORY" -> {                                            // 注入受控历史：验证精度去重 / 价格变化 / 非法跳过
                LocalDate d1 = LocalDate.of(2000, 1, 1);
                LocalDate d2 = LocalDate.of(2000, 1, 2);
                first.setPriceHistory(Arrays.asList(
                        pricePoint("5999", d1, "历史"),
                        pricePoint("5999.00", d1, "精度重复"),
                        pricePoint("5999", d1, "同日同价重复"),
                        pricePoint("88888", d2, "价格变化"),
                        pricePoint("-100", d2, "非法负数"),
                        pricePoint(null, d2, "缺失价格"),
                        pricePoint("88888", null, "缺失日期")));
            }
            default -> { }
        }
    }

    /** 构造一个历史价格点（Step 12 故障注入用）：price 为 null 表示缺失价格 */
    private ExternalPriceDTO pricePoint(String price, LocalDate date, String event) {
        ExternalPriceDTO p = new ExternalPriceDTO();
        p.setPrice(price == null ? null : new BigDecimal(price));
        p.setDate(date);
        p.setEvent(event);
        return p;
    }

    // ---------- 延迟与异常模拟 ----------

    /** 模拟外部 API 网络延迟（默认 100~500ms，可关闭） */
    private void simulateDelay() {
        if (!delayEnabled) {
            return;
        }
        long delay = ThreadLocalRandom.current().nextLong(minDelayMs, maxDelayMs + 1);
        try {
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 按 errorMode 模拟数据源故障。
     *
     * 返回 NO_FAULT 表示「无需模拟、走真实数据」；返回 null 表示「返回 null 响应」（NULL_RESPONSE）；
     * 返回错误响应表示对应错误码；CONNECTION_ERROR 直接抛出运行时异常（模拟连接失败/非法 JSON 等）。
     */
    private ExternalProductResponse simulateFailure() {
        String mode = errorMode == null ? "SUCCESS" : errorMode.trim().toUpperCase();
        if ("CONNECTION_ERROR".equals(mode)) {
            // 连接失败 / 非法 JSON / 未知运行时异常：真实 Provider 由 HTTP 客户端或反序列化抛异常
            throw new RuntimeException("数据源连接失败（模拟运行时异常）");
        }
        return switch (mode) {
            case "NULL_RESPONSE" -> null;
            case "EMPTY" -> build(200, "success", List.of(), 0);
            case "TIMEOUT" -> build(408, "数据源请求超时", null, 0);
            case "RATE_LIMIT" -> build(429, "数据源请求频率受限", null, 0);
            case "UNAUTHORIZED" -> build(401, "数据源认证失败（未授权）", null, 0);
            case "FORBIDDEN" -> build(403, "数据源拒绝访问", null, 0);
            case "NOT_FOUND" -> build(404, "商品不存在", null, 0);
            case "SERVER_ERROR" -> build(500, "数据源服务异常", null, 0);
            case "BAD_GATEWAY" -> build(502, "数据源网关错误", null, 0);
            case "SERVICE_UNAVAILABLE" -> build(503, "数据源服务不可用", null, 0);
            default -> NO_FAULT;   // SUCCESS 及其他未知值
        };
    }

    // ---------- 数据加载 ----------

    /** 从 products.json 加载原始数据并转换为本平台视角的 ExternalProductDTO */
    private List<ExternalProductDTO> loadCatalog() {
        try (InputStream in = new ClassPathResource("mock-data/products.json").getInputStream()) {
            List<MockProduct> raw = objectMapper.readValue(in, new TypeReference<List<MockProduct>>() {
            });
            String code = getPlatformCode();
            return raw.stream()
                    .map(p -> toExternalProductDTO(p, code))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new IllegalStateException("加载 mock-data/products.json 失败：" + e.getMessage(), e);
        }
    }

    /** 把一条 canonical 商品 + 某平台报价 转换为该平台的 ExternalProductDTO */
    private ExternalProductDTO toExternalProductDTO(MockProduct raw, String platformCode) {
        PlatformOffering offering = raw.getPlatforms().get(platformCode);
        if (offering == null) {
            return null;   // 该平台无此商品
        }
        ExternalProductDTO dto = new ExternalProductDTO();
        dto.setExternalProductId(offering.getExternalProductId());
        dto.setTitle(offering.getTitle() != null ? offering.getTitle() : raw.getTitle());
        dto.setBrand(raw.getBrand());
        dto.setCategory(raw.getCategory());
        dto.setModel(raw.getModel());
        dto.setDescription(raw.getDescription());
        dto.setPrice(offering.getPrice());
        dto.setOriginalPrice(offering.getOriginalPrice() != null ? offering.getOriginalPrice() : raw.getOfficialPrice());
        dto.setShopName(offering.getShopName());
        dto.setSku(offering.getSku());
        dto.setUrl(offering.getUrl());
        dto.setStock(offering.getStock());
        dto.setPromotionStatus(offering.getPromotionStatus());
        dto.setImages(raw.getImages());
        dto.setSpecs(raw.getSpecs());
        dto.setSales(raw.getSales());
        dto.setHeat(raw.getHeat());
        dto.setRating(raw.getRating());
        dto.setPerformanceScore(raw.getPerformanceScore());
        dto.setLaunchDate(LocalDate.parse(raw.getLaunchDate()));
        dto.setPriceHistory(generatePriceHistory(raw, offering.getPrice()));
        return dto;
    }

    /** 生成真实感历史价格（确定性、含促销节点、末点锚定为当前价） */
    private List<ExternalPriceDTO> generatePriceHistory(MockProduct raw, BigDecimal currentPrice) {
        LocalDate launch = LocalDate.parse(raw.getLaunchDate());
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(historyDays - 1L);
        if (start.isBefore(launch)) {
            start = launch;
        }
        double volatility = VOLATILITY.getOrDefault(raw.getCategory(), 0.04);
        Random rnd = new Random(raw.getModel().hashCode());
        double price = raw.getOfficialPrice().doubleValue();
        List<ExternalPriceDTO> history = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(today); d = d.plusDays(1)) {
            String event = "常规";
            double factor = 1.0;
            int month = d.getMonthValue();
            int day = d.getDayOfMonth();
            if (d.equals(launch)) {
                event = "新品首发";
            } else if (month == 6 && day == 18) {
                factor = 1 - volatility * 2.0;
                event = "618";
            } else if (month == 11 && day == 11) {
                factor = 1 - volatility * 2.5;
                event = "双11";
            } else if (month == 12 && day == 12) {
                factor = 1 - volatility * 2.0;
                event = "双12";
            } else if (month == 1 && day >= 20 && day <= 28) {
                factor = 1 - volatility * 1.5;
                event = "春节促销";
            } else {
                factor = 1 + (rnd.nextDouble() - 0.5) * volatility * 2.0;
            }
            price = Math.max(price * factor, currentPrice.doubleValue() * 0.8);
            ExternalPriceDTO point = new ExternalPriceDTO();
            point.setPrice(BigDecimal.valueOf(Math.round(price)));
            point.setDate(d);
            point.setEvent(event);
            history.add(point);
        }
        if (!history.isEmpty()) {
            ExternalPriceDTO last = history.get(history.size() - 1);
            last.setPrice(currentPrice);
            last.setEvent("当前");
        }
        return history;
    }

    // ---------- 辅助方法 ----------

    private boolean matches(ExternalProductDTO p, String kw) {
        return contains(p.getTitle(), kw)
                || contains(p.getBrand(), kw)
                || contains(p.getModel(), kw)
                || contains(p.getCategory(), kw);
    }

    private boolean contains(String value, String kw) {
        return value != null && value.toLowerCase().contains(kw);
    }

    private ExternalProductResponse paging(List<ExternalProductDTO> list, int page, int pageSize) {
        int p = Math.max(1, page);
        int size = Math.max(1, pageSize);
        int from = (p - 1) * size;
        if (from >= list.size()) {
            return build(200, "success", List.of(), list.size());
        }
        int to = Math.min(from + size, list.size());
        return build(200, "success", new ArrayList<>(list.subList(from, to)), list.size());
    }

    private ExternalProductResponse build(int code, String message, List<ExternalProductDTO> data, int total) {
        ExternalProductResponse resp = new ExternalProductResponse();
        resp.setCode(code);
        resp.setMessage(message);
        resp.setData(data);
        resp.setTotal(total);
        return resp;
    }

    // ---------- JSON 原始结构 ----------

    @Data
    static class MockProduct {
        private String model;
        private String brand;
        private String category;
        private String title;
        private String description;
        private BigDecimal officialPrice;
        private Integer sales;
        private Integer heat;
        private Double rating;
        private Integer performanceScore;
        private String launchDate;
        private Map<String, String> specs;
        private List<String> images;
        private Map<String, PlatformOffering> platforms;
    }

    @Data
    static class PlatformOffering {
        private String externalProductId;
        private String title;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private String shopName;
        private String sku;
        private String url;
        private Boolean stock;
        private String promotionStatus;
    }
}
