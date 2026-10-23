INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'os', '操作系统', 'iOS 18', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'release', '上市时间', '2024-09', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'chip', '处理器', 'Apple A18 Pro', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'screen_size', '屏幕尺寸', '6.3英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'resolution', '分辨率', '2622×1206', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'panel', '面板类型', 'OLED (Super Retina XDR)', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'ram', '运行内存', '8GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'storage', '机身存储', '128GB/256GB/512GB/1TB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'camera_rear', '后置摄像头', '48MP主摄+48MP超广角+12MP 5倍长焦', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'camera_front', '前置摄像头', '12MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 1, 'weight', '重量', '199g', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=1 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'os', '操作系统', 'iOS 17', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'release', '上市时间', '2023-09', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'chip', '处理器', 'Apple A16 Bionic', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'screen_size', '屏幕尺寸', '6.1英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'resolution', '分辨率', '2556×1179', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'panel', '面板类型', 'OLED (Super Retina XDR)', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'ram', '运行内存', '6GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'storage', '机身存储', '128GB/256GB/512GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'camera_rear', '后置摄像头', '48MP主摄+12MP超广角', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'camera_front', '前置摄像头', '12MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 2, 'weight', '重量', '171g', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=2 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'os', '操作系统', 'HarmonyOS 4', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'release', '上市时间', '2023-08', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'chip', '处理器', '麒麟9000S', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'screen_size', '屏幕尺寸', '6.82英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'resolution', '分辨率', '2720×1260', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'panel', '面板类型', 'OLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'ram', '运行内存', '12GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'storage', '机身存储', '512GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'camera_rear', '后置摄像头', '50MP可变光圈主摄+48MP超广角+12MP长焦', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'camera_front', '前置摄像头', '13MP+3D深感', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'battery', '电池容量', '5000mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'wired_charging', '充电', '88W有线+50W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 3, 'weight', '重量', '225g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=3 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'os', '操作系统', 'HarmonyOS 4.2', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'release', '上市时间', '2024-04', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'chip', '处理器', '麒麟9010', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'screen_size', '屏幕尺寸', '6.8英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'resolution', '分辨率', '2844×1260', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'panel', '面板类型', 'OLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'ram', '运行内存', '12GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'storage', '机身存储', '256GB/512GB/1TB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'camera_rear', '后置摄像头', '50MP可变光圈主摄+12.5MP超广角+48MP超聚光微距长焦', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'camera_front', '前置摄像头', '13MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'battery', '电池容量', '5050mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'wired_charging', '充电', '100W有线+80W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 4, 'weight', '重量', '220g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=4 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'os', '操作系统', 'Xiaomi HyperOS（澎湃OS）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'release', '上市时间', '2023-10', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'chip', '处理器', '骁龙8 Gen3', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'screen_size', '屏幕尺寸', '6.36英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'resolution', '分辨率', '2670×1200', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'panel', '面板类型', 'LTPO AMOLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'ram', '运行内存', '12GB/16GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'storage', '机身存储', '256GB/512GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'camera_rear', '后置摄像头', '50MP徕卡主摄+50MP浮动长焦+50MP超广角', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'camera_front', '前置摄像头', '32MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'battery', '电池容量', '4610mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'wired_charging', '充电', '90W有线+50W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 6, 'weight', '重量', '188g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=6 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'os', '操作系统', 'ColorOS 14', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'release', '上市时间', '2024-01', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'chip', '处理器', '骁龙8 Gen3', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'screen_size', '屏幕尺寸', '6.82英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'resolution', '分辨率', '3168×1440', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'panel', '面板类型', 'LTPO AMOLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'ram', '运行内存', '16GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'storage', '机身存储', '256GB/512GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'camera_rear', '后置摄像头', '哈苏四摄：50MP主摄+50MP超广角+50MP 3倍长焦+50MP 6倍潜望', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'camera_front', '前置摄像头', '32MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'battery', '电池容量', '5000mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'wired_charging', '充电', '100W有线+50W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 7, 'weight', '重量', '221g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=7 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'os', '操作系统', 'MagicOS 8.0', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'release', '上市时间', '2024-01', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'chip', '处理器', '骁龙8 Gen3', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'screen_size', '屏幕尺寸', '6.8英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'resolution', '分辨率', '2800×1280', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'panel', '面板类型', 'LTPO OLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'ram', '运行内存', '16GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'storage', '机身存储', '256GB/512GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'camera_rear', '后置摄像头', '50MP主摄+1.8亿像素潜望长焦+3D深感', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'camera_front', '前置摄像头', '12MP+3D深感', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'battery', '电池容量', '5600mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'wired_charging', '充电', '80W有线+66W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 10, 'weight', '重量', '229g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=10 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'os', '操作系统', 'One UI 6.1（Android 14）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'release', '上市时间', '2024-01', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'chip', '处理器', '骁龙8 Gen3（国行）', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'screen_size', '屏幕尺寸', '6.2英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'resolution', '分辨率', '2340×1080', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'panel', '面板类型', 'Dynamic AMOLED 2X', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'ram', '运行内存', '12GB（国行）', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'storage', '机身存储', '256GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'camera_rear', '后置摄像头', '50MP主摄+12MP超广角+10MP 3倍长焦', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'camera_front', '前置摄像头', '12MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'battery', '电池容量', '4000mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'wired_charging', '充电', '25W有线+15W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 11, 'weight', '重量', '167g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=11 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 23, 'chip', '处理器', 'Apple M3（8核CPU/10核GPU）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=23 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 23, 'ram', '运行内存', '8GB统一内存（可选16GB/24GB）', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=23 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 23, 'storage', '机身存储', '256GB/512GB/1TB/2TB SSD', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=23 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 23, 'screen', '屏幕', '13.6英寸 Liquid Retina 2560×1664 60Hz', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=23 AND spec_key='screen');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 23, 'battery', '续航', '最长18小时（官方标称）', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=23 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 23, 'weight', '重量', '1.24kg', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=23 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 24, 'chip', '处理器', 'Apple M3（8核CPU/10核GPU）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=24 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 24, 'ram', '运行内存', '8GB统一内存（可选16GB/24GB）', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=24 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 24, 'storage', '机身存储', '512GB/1TB/2TB SSD', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=24 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 24, 'screen', '屏幕', '14.2英寸 Liquid Retina XDR 3024×1964 120Hz ProMotion', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=24 AND spec_key='screen');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 24, 'battery', '续航', '最长22小时（官方标称）', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=24 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 24, 'weight', '重量', '1.55kg', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=24 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'os', '操作系统', 'One UI 6（Android 14）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'release', '上市时间', '2023-02', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'chip', '处理器', '骁龙8 Gen2 for Galaxy', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'screen_size', '屏幕尺寸', '6.1英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'resolution', '分辨率', '2340×1080', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'panel', '面板类型', 'Dynamic AMOLED 2X', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'ram', '运行内存', '8GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'storage', '机身存储', '128GB/256GB/512GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'camera_rear', '后置摄像头', '50MP主摄+12MP超广角+10MP 3倍长焦', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'camera_front', '前置摄像头', '12MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'battery', '电池容量', '3900mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'wired_charging', '充电', '25W有线+15W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45493, 'weight', '重量', '168g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45493 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'os', '操作系统', 'One UI 5（Android 13）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'release', '上市时间', '2022-02', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'chip', '处理器', '骁龙8 Gen1（国行）', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'screen_size', '屏幕尺寸', '6.8英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'resolution', '分辨率', '3088×1440', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'refresh', '刷新率', '120Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'panel', '面板类型', 'Dynamic AMOLED 2X', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'ram', '运行内存', '12GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'storage', '机身存储', '128GB/256GB/512GB/1TB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'camera_rear', '后置摄像头', '108MP主摄+12MP超广角+10MP 3倍+10MP 10倍长焦', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'camera_front', '前置摄像头', '40MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'battery', '电池容量', '5000mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'wired_charging', '充电', '45W有线+15W无线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45494, 'weight', '重量', '228g（含S Pen）', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45494 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'os', '操作系统', 'iOS 15.4', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'release', '上市时间', '2022-03', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'chip', '处理器', 'Apple A15 Bionic', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'screen_size', '屏幕尺寸', '4.7英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'resolution', '分辨率', '1334×750', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'panel', '面板类型', 'LCD (Retina HD)', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'ram', '运行内存', '4GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'storage', '机身存储', '64GB/128GB/256GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'camera_rear', '后置摄像头', '12MP', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'camera_front', '前置摄像头', '7MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45495, 'weight', '重量', '144g', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45495 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45497, 'os', '操作系统', 'watchOS 10', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45497 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45497, 'release', '上市时间', '2022-09', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45497 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45497, 'screen', '屏幕', '40/44mm Retina LTPO OLED', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45497 AND spec_key='screen');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45497, 'water', '防水', '50米防水（5ATM）', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45497 AND spec_key='water');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45501, 'os', '操作系统', 'watchOS 7（可升级）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45501 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45501, 'release', '上市时间', '2020-09', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45501 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45501, 'screen', '屏幕', '40/44mm Retina LTPO OLED', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45501 AND spec_key='screen');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45501, 'water', '防水', '50米防水（5ATM）', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45501 AND spec_key='water');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'os', '操作系统', 'iOS 11', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'release', '上市时间', '2017-09', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'chip', '处理器', 'Apple A11 Bionic', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'screen_size', '屏幕尺寸', '5.8英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'resolution', '分辨率', '2436×1125', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'panel', '面板类型', 'OLED (Super Retina HD)', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'ram', '运行内存', '3GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'storage', '机身存储', '64GB/256GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'camera_rear', '后置摄像头', '12MP双摄（广角+长焦）', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'camera_front', '前置摄像头', '7MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45532, 'weight', '重量', '174g', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45532 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'os', '操作系统', 'iOS 13', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'release', '上市时间', '2019-09', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'chip', '处理器', 'Apple A13 Bionic', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'screen_size', '屏幕尺寸', '6.1英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'resolution', '分辨率', '1792×828', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'panel', '面板类型', 'LCD (Liquid Retina HD)', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'ram', '运行内存', '4GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'storage', '机身存储', '64GB/128GB/256GB', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'camera_rear', '后置摄像头', '12MP双摄（广角+超广角）', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'camera_front', '前置摄像头', '12MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45534, 'weight', '重量', '194g', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45534 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'os', '操作系统', 'Android 7.0（可升级至 Android 9）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'release', '上市时间', '2017-04', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'chip', '处理器', 'Exynos 8895（国行骁龙835）', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'screen_size', '屏幕尺寸', '5.8英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'resolution', '分辨率', '2960×1440', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'panel', '面板类型', 'Super AMOLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'ram', '运行内存', '4GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'storage', '机身存储', '64GB+microSD', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'camera_rear', '后置摄像头', '12MP', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'camera_front', '前置摄像头', '8MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'battery', '电池容量', '3000mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'wired_charging', '充电', '15W有线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45535, 'weight', '重量', '155g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45535 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'os', '操作系统', 'Android 8.0（可升级至 Android 10）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'release', '上市时间', '2018-03', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'chip', '处理器', 'Exynos 9810（国行骁龙845）', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'screen_size', '屏幕尺寸', '5.8英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'resolution', '分辨率', '2960×1440', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'panel', '面板类型', 'Super AMOLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'ram', '运行内存', '4GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'storage', '机身存储', '64GB+microSD', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'camera_rear', '后置摄像头', '12MP可变光圈（f/1.5-f/2.4）', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'camera_front', '前置摄像头', '8MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'battery', '电池容量', '3000mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'wired_charging', '充电', '15W有线', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45536, 'weight', '重量', '163g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45536 AND spec_key='weight');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'os', '操作系统', 'Android 9（可升级至 Android 12）', 1, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='os');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'release', '上市时间', '2019-02', 2, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='release');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'chip', '处理器', 'Exynos 9820（国行骁龙855）', 3, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='chip');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'screen_size', '屏幕尺寸', '6.4英寸', 4, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='screen_size');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'resolution', '分辨率', '3040×1440', 5, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='resolution');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'refresh', '刷新率', '60Hz', 6, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='refresh');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'panel', '面板类型', 'Dynamic AMOLED', 7, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='panel');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'ram', '运行内存', '8GB', 8, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='ram');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'storage', '机身存储', '128GB+microSD', 9, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='storage');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'camera_rear', '后置摄像头', '12MP主摄+12MP长焦+16MP超广角', 10, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='camera_rear');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'camera_front', '前置摄像头', '10MP+8MP', 11, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='camera_front');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'battery', '电池容量', '4100mAh', 12, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='battery');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'wired_charging', '充电', '15W有线+无线充电', 13, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='wired_charging');
INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT 45537, 'weight', '重量', '175g', 14, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=45537 AND spec_key='weight');