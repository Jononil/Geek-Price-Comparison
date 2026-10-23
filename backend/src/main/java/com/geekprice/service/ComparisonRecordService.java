package com.geekprice.service;

import com.geekprice.entity.ComparisonRecord;

import java.util.List;

public interface ComparisonRecordService {

    void record(List<Long> productIds);

    List<ComparisonRecord> listByUser();
}
