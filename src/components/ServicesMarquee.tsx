import React from 'react';

const services = [
  'Pottery & Ceramics', 'Traditional Weaving', 'Wood Carving', 'Metalwork & Jewelry', 
  'Leather Crafting', 'Textile Design', 'Stone Carving', 'Basket Weaving',
  'Beadwork', 'Embroidery', 'Painting & Art', 'Sculpture', 'Furniture Making',
  'Traditional Medicine', 'Hair Braiding', 'Fashion Design', 'Music & Instruments',
  'Photography', 'Catering Services', 'Event Planning', 'Home Repair', 'Gardening'
];

export const ServicesMarquee = () => {
  return (
    <div className="w-full overflow-hidden py-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {services.map((service, index) => (
            <span
              key={`first-${index}`}
              className="mx-8 text-lg font-medium text-muted-foreground hover:text-primary transition-colors duration-300 cursor-default"
            >
              {service}
            </span>
          ))}
        </div>
        <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap">
          {services.map((service, index) => (
            <span
              key={`second-${index}`}
              className="mx-8 text-lg font-medium text-muted-foreground hover:text-primary transition-colors duration-300 cursor-default"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};