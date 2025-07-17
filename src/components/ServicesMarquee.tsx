import React, { useRef, useEffect, useState } from 'react';

const services = [
  'Pottery & Ceramics', 'Traditional Weaving', 'Wood Carving', 'Metalwork & Jewelry', 
  'Leather Crafting', 'Textile Design', 'Stone Carving', 'Basket Weaving',
  'Beadwork', 'Embroidery', 'Painting & Art', 'Sculpture', 'Furniture Making',
  'Traditional Medicine', 'Hair Braiding', 'Fashion Design', 'Music & Instruments',
  'Photography', 'Catering Services', 'Event Planning', 'Home Repair', 'Gardening'
];

export const ServicesMarquee = () => {
  const [animationOffset, setAnimationOffset] = useState(0);
  const animationRef = useRef<number>();

  // Create duplicated services for seamless scrolling
  const duplicatedServices = [...services, ...services, ...services];

  useEffect(() => {
    const animate = () => {
      setAnimationOffset(prev => {
        const newOffset = prev - 0.1; // Slower, more comfortable speed
        // Seamless reset at exactly one third to prevent visible jumps
        if (newOffset <= -33.333333) {
          return 0;
        }
        return newOffset;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full overflow-hidden py-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
      <div className="relative select-none">
        <div 
          className="flex whitespace-nowrap"
          style={{
            transform: `translateX(${animationOffset}%)`,
            willChange: 'transform'
          }}
        >
          {duplicatedServices.map((service, index) => (
            <span
              key={index}
              className="mx-8 text-lg font-medium text-muted-foreground hover:text-primary transition-colors duration-300 pointer-events-none"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};