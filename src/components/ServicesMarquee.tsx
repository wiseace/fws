import React, { useRef, useState, useEffect } from 'react';

const services = [
  'Pottery & Ceramics', 'Traditional Weaving', 'Wood Carving', 'Metalwork & Jewelry', 
  'Leather Crafting', 'Textile Design', 'Stone Carving', 'Basket Weaving',
  'Beadwork', 'Embroidery', 'Painting & Art', 'Sculpture', 'Furniture Making',
  'Traditional Medicine', 'Hair Braiding', 'Fashion Design', 'Music & Instruments',
  'Photography', 'Catering Services', 'Event Planning', 'Home Repair', 'Gardening'
];

export const ServicesMarquee = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [animationOffset, setAnimationOffset] = useState(0);
  const animationRef = useRef<number>();

  // Create duplicated services for seamless scrolling
  const duplicatedServices = [...services, ...services, ...services];

  useEffect(() => {
    const animate = () => {
      if (!isDragging) {
        setAnimationOffset(prev => (prev - 0.5) % -33.333);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset(0);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const moveX = e.movementX || 0;
    setDragOffset(prev => prev + (moveX * 0.5));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Gradually reduce drag offset back to 0
    const resetDrag = () => {
      setDragOffset(prev => {
        const newOffset = prev * 0.95;
        if (Math.abs(newOffset) > 0.1) {
          requestAnimationFrame(resetDrag);
          return newOffset;
        }
        return 0;
      });
    };
    resetDrag();
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const moveX = e.movementX || 0;
      setDragOffset(prev => prev + (moveX * 0.5));
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  const totalOffset = animationOffset + dragOffset;

  return (
    <div className="w-full overflow-hidden py-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 relative">
      <div 
        ref={containerRef}
        className="relative cursor-drag-custom select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          className="flex whitespace-nowrap transition-transform duration-75 ease-out"
          style={{
            transform: `translateX(${totalOffset}%)`
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