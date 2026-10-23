
DELETE s FROM product_specs s JOIN products p ON p.id=s.product_id JOIN categories c ON c.id=p.category_id WHERE c.name='手机';
DELETE FROM product_specs WHERE product_id IN (23,24,45497,45501);
SELECT CONCAT('剩余规格=', (SELECT COUNT(*) FROM product_specs));