package com.geekprice.provider.standardizer;

import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSpec;
import com.geekprice.provider.dto.ExternalPriceDTO;
import com.geekprice.provider.dto.ExternalProductDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 商品标准化器实现。
 *
 * 采用「规则归一化」，不引入 NLP / 机器学习 / 相似度算法：
 * 1. 品牌：中文别名映射 + 转大写；
 * 2. 型号：转大写、去空格、剔除品牌冗余前缀 / 容量 / 颜色词、保留字母数字与点/短横线；
 * 3. 容量：256G / 256GB / 256 GB 统一为 256GB，1T 统一为 1TB；
 * 4. 身份：brand + model + coreSpec 拼成 normalizedKey。
 *
 * 本类为无状态纯转换器，不依赖 Mapper / 数据库，不写入任何数据。
 */
@Component
public class ProductStandardizerImpl implements ProductStandardizer {

    // 品牌中文别名 -> 英文标准品牌（英文名走「转大写」即可，无需逐条映射）
    private static final Map<String, String> BRAND_ALIAS = Map.ofEntries(
            Map.entry("苹果", "APPLE"),
            Map.entry("华为", "HUAWEI"),
            Map.entry("小米", "XIAOMI"),
            Map.entry("三星", "SAMSUNG"),
            Map.entry("荣耀", "HONOR"),
            Map.entry("联想", "LENOVO"),
            Map.entry("戴尔", "DELL"),
            Map.entry("惠普", "HP"),
            Map.entry("索尼", "SONY"),
            Map.entry("罗技", "LOGITECH"),
            Map.entry("雷蛇", "RAZER"),
            Map.entry("佳能", "CANON"),
            Map.entry("闪迪", "SANDISK"),
            Map.entry("任天堂", "NINTENDO"),
            Map.entry("华硕", "ASUS"),
            Map.entry("英伟达", "NVIDIA"),
            Map.entry("大疆", "DJI")
    );

    // 分类别名 -> 标准分类名（categories 表为平铺结构，别名统一到标准名即可命中）
    private static final Map<String, String> CATEGORY_ALIAS = Map.ofEntries(
            Map.entry("平板", "平板电脑"),
            Map.entry("移动硬盘", "固态硬盘"),
            Map.entry("游戏设备", "游戏机")
    );

    // 容量抽取：256G / 256GB / 256 GB / 256g / 1TB / 2T 等
    private static final Pattern CAPACITY_PATTERN =
            Pattern.compile("(\\d+)\\s*(GB|G|TB|T)", Pattern.CASE_INSENSITIVE);

    // 作为「核心规格（容量）」来源的规格键。只取存储类容量，不取 RAM（内存），
    // 避免把「16GB 内存 + 1TB 硬盘」误识别成 16GB。
    private static final List<String> STORAGE_KEYS = List.of("硬盘", "存储", "容量");

    // 常见颜色词：颜色只影响展示，不影响商品身份，身份归一化时剔除
    private static final List<String> COLOR_WORDS = List.of(
            "深空灰", "星光色", "钛金属", "深空黑", "曜金黑", "原色钛金属", "墨羽",
            "黑色", "白色", "蓝色", "红色", "绿色", "紫色", "金色", "银色", "灰色", "粉色",
            "钛黑", "钛金", "钛灰",
            "黑", "白", "蓝", "红", "绿", "紫", "金", "银", "灰", "粉"
    );

    // 规格键别名：不同平台 / 品类对同一参数的不同命名统一到中文标准名（如笔记本 CPU -> 处理器）。
    // 仅收录现有数据中真实存在的同义词，不凭空造别名。
    private static final Map<String, String> SPEC_KEY_ALIAS = Map.ofEntries(
            Map.entry("CPU", "处理器")
    );

    // 规格值中的容量格式统一：256 GB / 256GB / 256gb / 1 TB / 1TB -> 256GB / 1TB。
    // 只归一「显式 GB/TB」单位，不碰裸 G/T（会与重量 g、主频 GHz、接口 2.5G 等混淆），
    // 因此也不会误伤 1100g（克）、3.4GHz（主频）这类非容量值。
    private static final Pattern SPEC_CAPACITY_PATTERN =
            Pattern.compile("(\\d+)\\s*(GB|TB)", Pattern.CASE_INSENSITIVE);

    // ==================== 身份识别 ====================

    @Override
    public ProductIdentityKey buildIdentityKey(ExternalProductDTO dto) {
        String brand = normalizeBrand(dto.getBrand());
        String coreSpec = extractCoreSpec(dto);
        String model = normalizeModel(dto.getModel(), dto.getBrand(), coreSpec);
        String normalizedKey = join(brand, model, coreSpec);
        return ProductIdentityKey.builder()
                .brand(brand)
                .model(model)
                .coreSpec(coreSpec)
                .normalizedKey(normalizedKey)
                .build();
    }

    // ==================== 品牌归一化 ====================

    @Override
    public String normalizeBrand(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim();
        String mapped = BRAND_ALIAS.get(s);
        if (mapped != null) {
            return mapped;
        }
        // 无映射时兜底：转大写、去除内部空格（Apple -> APPLE、vivo -> VIVO、Intel -> INTEL）
        return s.toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    @Override
    public String normalizeCategory(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim();
        return CATEGORY_ALIAS.getOrDefault(s, s);
    }

    // ==================== 型号归一化 ====================

    private String normalizeModel(String raw, String brandRaw, String coreSpec) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim();
        // 1. 剔除与品牌重复的冗余前缀（vivo X200 -> X200；小米 15 Pro -> 15 Pro）
        s = removeIgnoreCase(s, brandRaw);
        s = removeIgnoreCase(s, normalizeBrand(brandRaw));
        // 2. 容量已进入 coreSpec，从型号中剔除（iPhone 17 256GB -> iPhone 17）
        if (coreSpec != null && !coreSpec.isEmpty()) {
            s = removeCapacityTokens(s);
        }
        // 3. 剔除颜色词（颜色不影响身份）
        s = removeColorWords(s);
        // 4. 转大写
        s = s.toUpperCase(Locale.ROOT);
        // 5. 去除空格
        s = s.replaceAll("\\s+", "");
        // 6. 仅保留字母 / 数字 / 点 / 短横线（点与短横线保留版本号与型号码，如 12.2 / i7-14700K）
        s = s.replaceAll("[^A-Z0-9.\\-]", "");
        return s;
    }

    /** 大小写不敏感地剔除 token（替换为空格，避免把相邻单词粘连） */
    private String removeIgnoreCase(String s, String token) {
        if (s == null || token == null || token.isBlank()) {
            return s;
        }
        return s.replaceAll("(?i)" + Pattern.quote(token.trim()), " ");
    }

    /** 剔除型号中的所有容量 token */
    private String removeCapacityTokens(String s) {
        return CAPACITY_PATTERN.matcher(s).replaceAll(" ");
    }

    /** 剔除颜色词 */
    private String removeColorWords(String s) {
        for (String color : COLOR_WORDS) {
            s = s.replace(color, " ");
        }
        return s;
    }

    // ==================== 容量归一化 ====================

    /** 把 256G / 256GB / 256 GB / 256g 归一为 256GB，1TB / 1T 归一为 1TB；无法识别返回 null */
    private String normalizeCapacity(String raw) {
        if (raw == null) {
            return null;
        }
        Matcher m = CAPACITY_PATTERN.matcher(raw.trim());
        if (!m.find()) {
            return null;
        }
        String number = m.group(1);
        String unit = m.group(2).toUpperCase(Locale.ROOT);
        return number + (unit.startsWith("T") ? "TB" : "GB");
    }

    /** 从规格中提取核心规格（容量），只认存储类键，避免与内存混淆 */
    private String extractCoreSpec(ExternalProductDTO dto) {
        Map<String, String> specs = dto.getSpecs();
        if (specs != null) {
            for (String key : STORAGE_KEYS) {
                String value = specs.get(key);
                if (value != null) {
                    String normalized = normalizeCapacity(value);
                    if (normalized != null) {
                        return normalized;
                    }
                }
            }
        }
        return "";
    }

    // ==================== 实体映射 ====================

    @Override
    public Product toProduct(ExternalProductDTO dto) {
        Product p = new Product();
        p.setName(buildName(dto));
        // brandId / categoryId 需查基础表解析，由 Step 5 落库时完成；此处先填展示用的名称字段
        p.setBrandName(dto.getBrand());
        p.setCategoryName(dto.getCategory());
        p.setDescription(dto.getDescription());
        p.setOfficialPrice(dto.getOriginalPrice());
        p.setCurrentPrice(dto.getPrice());
        p.setPerformanceScore(dto.getPerformanceScore());
        p.setUserRating(dto.getRating() == null ? null : BigDecimal.valueOf(dto.getRating()));
        p.setSales(dto.getSales());
        p.setHeat(dto.getHeat());
        p.setLaunchDate(dto.getLaunchDate());
        // score / valueScore / status / isRecommend / isHot 等由推荐与性价比算法、落库阶段计算，此处不设置
        return p;
    }

    /** 生成商品展示名：品牌 + 型号，型号已含品牌时避免重复 */
    private String buildName(ExternalProductDTO dto) {
        String brand = dto.getBrand() == null ? "" : dto.getBrand().trim();
        String model = dto.getModel() == null ? "" : dto.getModel().trim();
        if (model.isEmpty()) {
            return brand;
        }
        String modelNoBrand = removeIgnoreCase(model, brand).trim();
        return brand.isEmpty() ? modelNoBrand : brand + " " + modelNoBrand;
    }

    @Override
    public List<ProductSpec> toSpecs(ExternalProductDTO dto, Long productId) {
        List<ProductSpec> result = new ArrayList<>();
        Map<String, String> specs = dto.getSpecs();
        if (specs == null) {
            return result;
        }
        int sort = 1;
        for (Map.Entry<String, String> entry : specs.entrySet()) {
            // 空键 / 空值视为缺失规格：跳过，不报错、不阻断产品同步（spec_value 为 NOT NULL）
            String key = normalizeSpecKey(entry.getKey());
            String value = normalizeSpecValue(entry.getValue());
            if (key == null || key.isBlank() || value == null) {
                continue;
            }
            ProductSpec spec = new ProductSpec();
            spec.setProductId(productId);
            // specKey 为统一后的参数名（如 CPU -> 处理器），specLabel 保留原始参数名便于追溯
            spec.setSpecKey(key);
            spec.setSpecLabel(entry.getKey().trim());
            spec.setSpecValue(value);
            spec.setSort(sort++);
            result.add(spec);
        }
        return result;
    }

    /** 规格键标准化：去首尾空白 + 同义词统一（如 CPU -> 处理器） */
    private String normalizeSpecKey(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        return SPEC_KEY_ALIAS.getOrDefault(s, s);
    }

    /** 规格值标准化：去首尾空白 + 显式 GB/TB 容量格式统一；空值返回 null（供调用方跳过） */
    private String normalizeSpecValue(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.isEmpty()) {
            return null;
        }
        return SPEC_CAPACITY_PATTERN.matcher(s).replaceAll(m ->
                m.group(1) + m.group(2).toUpperCase(Locale.ROOT));
    }

    @Override
    public ProductImage toProductImage(ExternalProductDTO dto, Long productId, int sort) {
        ProductImage image = new ProductImage();
        image.setProductId(productId);
        image.setSort(sort);
        List<String> images = dto.getImages();
        image.setUrl((images != null && sort >= 0 && sort < images.size()) ? images.get(sort) : null);
        return image;
    }

    @Override
    public ProductPrice toProductPrice(ExternalProductDTO dto, Long productId, Long platformId) {
        ProductPrice price = new ProductPrice();
        price.setProductId(productId);
        price.setPlatformId(platformId);
        price.setTitle(dto.getTitle());
        price.setUrl(dto.getUrl());
        price.setPrice(dto.getPrice());
        price.setOriginalPrice(dto.getOriginalPrice());
        price.setShopName(dto.getShopName());
        price.setIsOfficial(isOfficial(dto) ? 1 : 0);
        price.setStockStatus(Boolean.TRUE.equals(dto.getStock()) ? 1 : 0);
        return price;
    }

    /** 判断是否官方/自营：店铺名或促销状态含「官方」或「自营」即视为官方 */
    private boolean isOfficial(ExternalProductDTO dto) {
        String shop = dto.getShopName() == null ? "" : dto.getShopName();
        String promo = dto.getPromotionStatus() == null ? "" : dto.getPromotionStatus();
        String combined = shop + " " + promo;
        return combined.contains("官方") || combined.contains("自营");
    }

    @Override
    public List<PriceHistory> toPriceHistory(ExternalProductDTO dto, Long productId, Long platformId) {
        List<PriceHistory> result = new ArrayList<>();
        List<ExternalPriceDTO> history = dto.getPriceHistory();
        if (history == null) {
            return result;
        }
        for (ExternalPriceDTO point : history) {
            // 空价格 / 缺失日期 / 负数价格属异常点：跳过，不写入、不阻断商品同步（price / record_date 均为 NOT NULL）
            if (point == null || point.getPrice() == null || point.getDate() == null
                    || point.getPrice().signum() < 0) {
                continue;
            }
            PriceHistory ph = new PriceHistory();
            ph.setProductId(productId);
            ph.setPlatformId(platformId);
            ph.setPrice(point.getPrice());
            ph.setRecordDate(point.getDate());
            // PriceHistory 无 event 字段，将促销节点信息（618/双11/…）放入 source
            ph.setSource(point.getEvent());
            result.add(ph);
        }
        return result;
    }

    // ==================== 工具 ====================

    /** 用下划线拼接非空片段，生成 normalizedKey */
    private String join(String... parts) {
        return Arrays.stream(parts)
                .filter(p -> p != null && !p.isEmpty())
                .collect(Collectors.joining("_"));
    }
}
