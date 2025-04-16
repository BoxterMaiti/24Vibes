import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
}

const Card3D: React.FC<Card3DProps> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  let bounds: DOMRect | null = null;

  const rotateToMouse = (e: MouseEvent) => {
    if (!cardRef.current || !bounds || !glowRef.current) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const leftX = mouseX - bounds.x;
    const topY = mouseY - bounds.y;
    
    // Calculate normalized position (-1 to 1)
    const xNorm = (leftX / bounds.width) * 2 - 1;
    const yNorm = (topY / bounds.height) * 2 - 1;
    
    // Calculate rotation angles (max 15 degrees)
    const maxRotation = 15;
    const rotateY = xNorm * maxRotation;
    const rotateX = -yNorm * maxRotation;

    // Apply transform with perspective
    cardRef.current.style.transform = `
      perspective(1000px)
      scale3d(1.07, 1.07, 1.07)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
    `;

    // Update glow effect with opposite position
    const centerX = bounds.width / 2 - (xNorm * bounds.width) / 4;
    const centerY = bounds.height / 2 - (yNorm * bounds.height) / 4;
    
    glowRef.current.style.opacity = '1';
    glowRef.current.style.backgroundImage = `
      radial-gradient(
        circle at
        ${centerX}px
        ${centerY}px,
        rgba(255, 255, 255, 0.60),
        rgba(0, 0, 0, 0.01)
      )
    `;
  };

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    bounds = cardRef.current.getBoundingClientRect();
    document.addEventListener('mousemove', rotateToMouse);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;
    document.removeEventListener('mousemove', rotateToMouse);
    
    // Reset transform with transition
    cardRef.current.style.transform = '';
    
    // Fade out glow effect
    glowRef.current.style.opacity = '0';
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousemove', rotateToMouse);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`relative transition-all duration-300 ease-out ${className}`}
      style={{ 
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center'
      }}
    >
      {children}
      <div 
        ref={glowRef}
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0"
        style={{
          transition: 'opacity 0.3s ease-in-out',
          backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))'
        }}
      />
    </div>
  );
};

export default Card3D;