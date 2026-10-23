SELECT COALESCE(c.name,'(无分类)') AS cat, COUNT(*) AS total,
  SUM(CASE WHEN EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id=p.id AND pi.url NOT LIKE '%placehold.co%') THEN 1 ELSE 0 END) AS with_real
  FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.deleted=0 GROUP BY c.name ORDER BY total DESC;