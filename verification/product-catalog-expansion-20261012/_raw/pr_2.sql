INSERT INTO product_prices (product_id, platform_id, title, url, price, original_price, discount, shop_name, is_official, stock_status, deleted)
        SELECT 45545, 2, (SELECT CONCAT(name,'官方旗舰店') FROM products WHERE id=45545), 'https://item.example.com/45545', 5944.16, 6128.00, 3,
          CASE 2 WHEN 1 THEN '京东自营' WHEN 2 THEN '天猫旗舰店' ELSE '拼多多百亿补贴' END, 0, 1, 0
        FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_prices WHERE product_id=45545 AND platform_id=2);