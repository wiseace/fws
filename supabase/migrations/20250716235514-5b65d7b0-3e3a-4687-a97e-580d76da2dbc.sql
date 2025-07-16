-- Update service images with correct public URLs
UPDATE services 
SET image_url = '/service-images/hair-salon-professional.jpg'
WHERE service_name = 'Hair Saloon';

UPDATE services 
SET image_url = '/service-images/upholstery-professional.jpg'
WHERE service_name = 'Upholstery';

UPDATE services 
SET image_url = '/service-images/plumbing-professional.jpg'
WHERE service_name = 'Plumbing';

UPDATE services 
SET image_url = '/service-images/web-design-professional.jpg'
WHERE service_name = 'Professional Web Design';