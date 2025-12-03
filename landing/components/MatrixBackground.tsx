'use client';

import { useEffect, useRef, useState } from 'react';

export function MatrixBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create dot grid
    const createDots = () => {
      const dotSize = 2;
      const spacing = 20;
      const rows = Math.ceil(window.innerHeight / spacing);
      const cols = Math.ceil(window.innerWidth / spacing);

      // Clear existing dots
      container.innerHTML = '';

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const dot = document.createElement('div');
          dot.className = 'dot';
          dot.style.left = `${j * spacing}px`;
          dot.style.top = `${i * spacing}px`;
          dot.dataset.row = i.toString();
          dot.dataset.col = j.toString();
          container.appendChild(dot);
        }
      }
    };

    createDots();

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Activate dots near mouse
      const dots = container.querySelectorAll('.dot');
      const activateRadius = 100;

      dots.forEach(dot => {
        const rect = dot.getBoundingClientRect();
        const dotX = rect.left + rect.width / 2;
        const dotY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(dotX - e.clientX, 2) + Math.pow(dotY - e.clientY, 2)
        );

        if (distance < activateRadius) {
          dot.classList.add('active');
          setTimeout(() => dot.classList.remove('active'), 500);
        }
      });
    };

    // Handle scroll for color transitions
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollY / maxScroll;
      
      const dots = container.querySelectorAll('.dot');
      dots.forEach((dot, index) => {
        if (Math.random() < scrollPercent * 0.1) {
          dot.classList.add('secondary');
          setTimeout(() => dot.classList.remove('secondary'), 1000);
        }
      });
    };

    // Random dot activation
    const randomActivate = () => {
      const dots = container.querySelectorAll('.dot');
      const randomDot = dots[Math.floor(Math.random() * dots.length)];
      if (randomDot) {
        randomDot.classList.add('active');
        setTimeout(() => randomDot.classList.remove('active'), 300);
      }
    };

    // Initial random activation
    const initialInterval = setInterval(randomActivate, 200);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', createDots);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', createDots);
      clearInterval(initialInterval);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="matrix-dots"
      aria-hidden="true"
    />
  );
}
