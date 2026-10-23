package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.ComparisonRecord;
import com.geekprice.mapper.ComparisonRecordMapper;
import com.geekprice.security.SecurityUtil;
import com.geekprice.service.ComparisonRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComparisonRecordServiceImpl implements ComparisonRecordService {

    private final ComparisonRecordMapper comparisonRecordMapper;

    @Override
    public void record(List<Long> productIds) {
        Long userId = SecurityUtil.getCurrentUserId();
        String ids = productIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        ComparisonRecord record = new ComparisonRecord();
        record.setUserId(userId);
        record.setProductIds(ids);
        comparisonRecordMapper.insert(record);
    }

    @Override
    public List<ComparisonRecord> listByUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        return comparisonRecordMapper.selectList(new LambdaQueryWrapper<ComparisonRecord>()
                .eq(ComparisonRecord::getUserId, userId)
                .orderByDesc(ComparisonRecord::getCreatedAt)
                .last("LIMIT 20"));
    }
}
