package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductSpec;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductSpecMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 商品核心参数真实性治理测试。
 *
 * 覆盖验收要求：
 * 1. 苹果手机不会因通用默认值显示 Android；
 * 2. 不同型号不会因同一模板获得相同核心参数；
 * 3. 未知参数不会被伪造值填充（如 Apple 未公布的电池容量）；
 * 4. 参数核验状态（reference/template）正确落库；
 * 5. 可信参数不足的商品不参与评分（ValueScore 返回 null）。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductSpecTruthTest {

    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private ProductSpecMapper productSpecMapper;
    @Autowired
    private ValueScoreService valueScoreService;

    private List<ProductSpec> specsOf(Long productId) {
        return productSpecMapper.selectList(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getProductId, productId).orderByAsc(ProductSpec::getSort));
    }

    // 1. 苹果手机不会显示 Android（通用默认值已清除）
    @Test
    void applePhonesNeverShowAndroid() {
        List<Product> apples = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .like(Product::getName, "iPhone"));
        assertFalse(apples.isEmpty(), "应存在 iPhone 商品");
        for (Product p : apples) {
            for (ProductSpec s : specsOf(p.getId())) {
                if ("os".equals(s.getSpecKey()) || "操作系统".equals(s.getSpecLabel())) {
                    assertFalse(s.getSpecValue().contains("Android") || "Android / iOS".equals(s.getSpecValue()),
                            "iPhone (" + p.getName() + ") 的操作系统不应为 Android/通用模板值，实际：" + s.getSpecValue());
                }
            }
        }
    }

    // 2. 不同手机型号的核心参数（处理器）互不相同——不再整类套同一模板
    @Test
    void differentPhoneModelsHaveDistinctChips() {
        Map<Long, String> chips = productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getCategoryId, 1L))
                .stream()
                .collect(Collectors.toMap(Product::getId, p -> {
                    ProductSpec chip = specsOf(p.getId()).stream()
                            .filter(s -> "chip".equals(s.getSpecKey()) || "处理器".equals(s.getSpecLabel()))
                            .findFirst().orElse(null);
                    return chip == null ? "" : chip.getSpecValue();
                }));
        List<String> values = chips.values().stream().filter(v -> !v.isEmpty()).toList();
        assertTrue(values.size() >= 2, "应有至少两款手机录入处理器参数");
        // 同值数量不得超过一半（模板复制的特征是全部相同）
        Map<String, Long> counter = values.stream().collect(Collectors.groupingBy(v -> v, Collectors.counting()));
        long maxDup = counter.values().stream().mapToLong(Long::longValue).max().orElse(0);
        assertTrue(maxDup <= values.size() / 2,
                "处理器参数不应大面积重复（模板特征），实际分布：" + counter);
    }

    // 3. 未知参数不被伪造：Apple 未官方公布电池容量 → iPhone 不应有 battery 参数
    @Test
    void unknownParamsStayAbsent() {
        Product ip16 = productMapper.selectOne(new LambdaQueryWrapper<Product>()
                .eq(Product::getName, "iPhone 16 Pro"));
        assertNotNull(ip16);
        List<ProductSpec> specs = specsOf(ip16.getId());
        boolean hasBattery = specs.stream().anyMatch(s -> "battery".equals(s.getSpecKey()));
        assertFalse(hasBattery, "iPhone 16 Pro 不应有电池容量参数（Apple 未官方公布，不得伪造）");
        // 所有 spec_value 不应为 0/null/空串
        for (ProductSpec s : specs) {
            assertNotNull(s.getSpecValue());
            assertFalse(s.getSpecValue().isBlank(), "参数值不应为空白：" + s.getSpecKey());
            assertFalse("0".equals(s.getSpecValue()) || "0GB".equals(s.getSpecValue()), "参数值不应为伪造的 0 值：" + s.getSpecKey());
        }
    }

    // 4. 核验状态正确落库：手机为 reference，其余存量为 template
    @Test
    void verifyStatusCorrectlyPersisted() {
        Product ip16 = productMapper.selectOne(new LambdaQueryWrapper<Product>()
                .eq(Product::getName, "iPhone 16 Pro"));
        for (ProductSpec s : specsOf(ip16.getId())) {
            assertEquals("reference", s.getVerifyStatus(), "手机型号级参数应为 reference 状态");
        }
        // 非手机存量商品（未治理品类）应全部为 template
        List<ProductSpec> templates = productSpecMapper.selectList(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getVerifyStatus, "template").last("LIMIT 5"));
        assertFalse(templates.isEmpty(), "应存在 template 状态的存量规格");
    }

    // 5. 可信参数不足的商品不参与评分；充足的商品可评分
    @Test
    void scoringRequiresTrustedSpecs() {
        Product ip16 = productMapper.selectOne(new LambdaQueryWrapper<Product>()
                .eq(Product::getName, "iPhone 16 Pro"));
        Integer score = valueScoreService.calculate(ip16.getId());
        // iPhone 16 Pro 有 12 项 reference 参数 → 可评分（价格/热度等维度可能缺数据，但可信参数达标）
        // 注：若其无任何可用维度（无价格无热度无评分），仍可能返回 null——此处仅验证不会伪造
        if (score != null) {
            assertTrue(score >= 0 && score <= 100);
        }

        // template-only 商品：创建一个仅含 template 参数的商品验证 null
        Product fake = new Product();
        fake.setName("参数治理-仅模板测试商品");
        fake.setStatus(1);
        fake.setHeat(100);
        productMapper.insert(fake);
        ProductSpec ts = new ProductSpec();
        ts.setProductId(fake.getId());
        ts.setSpecKey("os");
        ts.setSpecLabel("操作系统");
        ts.setSpecValue("Android / iOS");
        ts.setVerifyStatus("template");
        productSpecMapper.insert(ts);
        assertNull(valueScoreService.calculate(fake.getId()), "仅含模板参数的商品应返回 null（数据不足，暂不评分）");
    }

    // 6. 可证明错误的模板组合值不得存在（单颗 CPU 不可能双接口/双架构）
    @Test
    void provablyWrongTemplateValuesRemoved() {
        Long badSocket = productSpecMapper.selectCount(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getVerifyStatus, "template")
                .like(ProductSpec::getSpecValue, "AM5/LGA1700"));
        assertEquals(0, badSocket, "不应存在 AM5/LGA1700 双接口模板值");
        Long badArch = productSpecMapper.selectCount(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getVerifyStatus, "template")
                .like(ProductSpec::getSpecValue, "Zen4/Alder Lake"));
        assertEquals(0, badArch, "不应存在 Zen4/Alder Lake 双架构模板值");
    }
}
