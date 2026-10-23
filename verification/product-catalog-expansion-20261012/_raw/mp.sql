SELECT p.id, p.name FROM products p WHERE p.deleted=0
  AND NOT EXISTS (SELECT 1 FROM product_images pi JOIN product_image_license l ON l.image_id=pi.id
    WHERE pi.product_id=p.id AND l.audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION')
      AND l.risk_notes IS NULL AND pi.url NOT LIKE '%placehold.co%');