package com.geekprice.provider.standardizer;

import com.geekprice.entity.ProductSpec;
import com.geekprice.provider.dto.ExternalProductDTO;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 规格参数标准化 单元测试（Step 10）。
 *
 * 覆盖 §6 要求的核心场景：
 * 1. 正常规格标准化（值去空白 + 容量格式统一）；
 * 2. 不同格式规格统一（容量 256 GB / 256gb / 1 TB；字段名 CPU -> 处理器）；
 * 3. 缺失规格（null / 空 map）返回空列表，不报错；
 * 4. 异常规格（空键 / 空值 / null 值）被跳过，不影响其余规格、不抛异常。
 */
@ActiveProfiles("test")
class ProductSpecStandardizationTest {

    private final ProductStandardizer standardizer = new ProductStandardizerImpl();

    private ExternalProductDTO dto(Map<String, String> specs) {
        ExternalProductDTO d = new ExternalProductDTO();
        d.setSpecs(specs);
        return d;
    }

    /** 单条规格（key=value）标准化后的 value */
    private String specValue(String key, String value) {
        List<ProductSpec> specs = standardizer.toSpecs(dto(Map.of(key, value)), 1L);
        assertEquals(1, specs.size(), "单条有效规格应保留");
        return specs.get(0).getSpecValue();
    }

    // ===== 测试 1：正常规格标准化 =====

    @Test
    void normalSpecStandardization() {
        List<ProductSpec> specs = standardizer.toSpecs(dto(Map.of(
                "处理器", " A19 Pro ",
                "存储", "256 GB",
                "屏幕", "6.1英寸 OLED")), 1L);
        assertEquals(3, specs.size());
        assertEquals("A19 Pro", specByKey(specs, "处理器"));
        assertEquals("256GB", specByKey(specs, "存储"));
        assertEquals("6.1英寸 OLED", specByKey(specs, "屏幕"));
    }

    // ===== 测试 2：不同格式规格统一 =====

    @Test
    void differentFormatSpecUnified() {
        // 容量格式统一：256 GB / 256gb / 1 TB -> 256GB / 1TB
        assertEquals("256GB", specValue("存储", "256 GB"));
        assertEquals("256GB", specValue("存储", "256gb"));
        assertEquals("1TB", specValue("存储", "1 TB"));
        // 字段名统一：CPU -> 处理器，同时 specLabel 保留原始字段名便于追溯
        List<ProductSpec> specs = standardizer.toSpecs(dto(Map.of("CPU", "M4 Pro")), 1L);
        assertEquals(1, specs.size());
        assertEquals("处理器", specs.get(0).getSpecKey());
        assertEquals("CPU", specs.get(0).getSpecLabel());
        assertEquals("M4 Pro", specs.get(0).getSpecValue());
    }

    // ===== 测试 3：缺失规格（null / 空 map）返回空列表，不报错 =====

    @Test
    void missingSpecsReturnsEmpty() {
        assertTrue(standardizer.toSpecs(dto(null), 1L).isEmpty());
        assertTrue(standardizer.toSpecs(dto(Map.of()), 1L).isEmpty());
    }

    // ===== 测试 4：异常规格（空键 / 空值 / null 值）被跳过，不影响其余规格 =====

    @Test
    void abnormalSpecSkippedWithoutBreaking() {
        Map<String, String> specs = new HashMap<>();
        specs.put("处理器", "A19 Pro");
        specs.put("", "无键值");       // 空键
        specs.put("电池", "");          // 空值
        specs.put("摄像头", null);      // null 值
        specs.put("存储", "256GB");

        List<ProductSpec> result = standardizer.toSpecs(dto(specs), 1L);

        assertEquals(2, result.size(), "只保留键值均有效的规格");
        assertEquals("A19 Pro", specByKey(result, "处理器"));
        assertEquals("256GB", specByKey(result, "存储"));
        assertNull(specByKey(result, "电池"), "空值规格应被跳过");
        assertNull(specByKey(result, "摄像头"), "null 值规格应被跳过");
    }

    /** 按统一后的 specKey 取 specValue，不存在返回 null */
    private String specByKey(List<ProductSpec> specs, String key) {
        return specs.stream()
                .filter(s -> key.equals(s.getSpecKey()))
                .map(ProductSpec::getSpecValue)
                .findFirst()
                .orElse(null);
    }
}
