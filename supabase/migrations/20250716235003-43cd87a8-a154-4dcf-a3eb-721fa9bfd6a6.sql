-- Update service images with professional images
UPDATE services 
SET image_url = '/src/assets/services/hair-salon.jpg'
WHERE service_name = 'Hair Saloon' AND (image_url IS NULL OR image_url = '');

UPDATE services 
SET image_url = '/src/assets/services/upholstery.jpg'
WHERE service_name = 'Upholstery' AND (image_url IS NULL OR image_url = '');

UPDATE services 
SET image_url = '/src/assets/services/plumbing.jpg'
WHERE service_name = 'Plumbing' AND (image_url IS NULL OR image_url = '');

UPDATE services 
SET image_url = '/src/assets/services/web-design.jpg'
WHERE service_name = 'Professional Web Design' AND (image_url IS NULL OR image_url = '');