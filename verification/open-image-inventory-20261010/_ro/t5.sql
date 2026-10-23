SELECT CASE
    WHEN url LIKE '%placehold.co%' THEN 'placeholder'
    WHEN url LIKE '%thumb.wikimedia%' THEN 'wikimedia_thumb'
    WHEN url LIKE '%upload.wikimedia%' THEN 'wikimedia_original'
    ELSE 'other' END AS kind, COUNT(*) FROM product_images GROUP BY kind ORDER BY 2 DESC;