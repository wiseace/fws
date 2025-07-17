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
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 1000);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 500);
  };

  // Create duplicated services for seamless scrolling
  const duplicatedServices = [...services, ...services, ...services];

  return (
    <div className="w-full overflow-hidden py-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 relative">
      {isHovered && (
        <div className="absolute top-4 right-4 z-10 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border">
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            Drag to scroll
          </span>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className={`relative overflow-x-auto scrollbar-hide ${
          isHovered ? 'cursor-grab' : ''
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div 
          className={`flex whitespace-nowrap transition-transform duration-300 ${
            !isPaused && !isHovered ? 'animate-marquee-smooth' : ''
          }`}
          style={{
            transform: isHovered && !isDragging ? 'translateX(0)' : undefined,
            animationPlayState: isPaused || isHovered ? 'paused' : 'running'
          }}
        >
          {duplicatedServices.map((service, index) => (
            <span
              key={index}
              className={`mx-8 text-lg font-medium transition-all duration-300 select-none ${
                isHovered 
                  ? 'text-primary hover:text-primary/80 hover:scale-105' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};