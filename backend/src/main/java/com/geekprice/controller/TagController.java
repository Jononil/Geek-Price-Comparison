package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.entity.Tag;
import com.geekprice.mapper.TagMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagMapper tagMapper;

    @GetMapping
    public Result<List<Tag>> list() {
        return Result.success(tagMapper.selectList(null));
    }
}
