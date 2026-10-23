SELECT COUNT(*) FROM product_images pi JOIN product_image_license l ON l.image_id=pi.id
      WHERE pi.product_id=24 AND l.audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION')
        AND l.risk_notes IS NULL AND pi.url NOT LIKE '%placehold.co%';