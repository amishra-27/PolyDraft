'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface SplashDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
}

function SplashDrawer({ isOpen, onClose, onAuthenticate }: SplashDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleAuthenticate = () => {
    onAuthenticate();
    handleClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentY(e.touches[0].clientY);
    const deltaY = currentY - startY;
    
    if (deltaY > 50 && drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    const deltaY = currentY - startY;
    
    if (deltaY > 100) {
      handleClose();
    } else if (drawerRef.current) {
      drawerRef.current.style.transform = '';
    }
    
    setStartY(0);
    setCurrentY(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`relative w-full max-w-md bg-surface border-t border-white/10 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-text-dim rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 28L14 22L20 25L26 18L32 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="14" cy="22" r="1.5" fill="white"/>
                <circle cx="20" cy="25" r="1.5" fill="white"/>
                <circle cx="26" cy="18" r="1.5" fill="white"/>
                <circle cx="8" cy="28" r="1.5" fill="white"/>
                <circle cx="32" cy="24" r="1.5" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">PolyDraft</h2>
            <p className="text-text-muted text-sm">
              Fantasy leagues for prediction markets
            </p>
          </div>

          {/* Authenticate Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleAuthenticate}
            className="w-full"
          >
            Continue with Base
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SplashPage() {
  const [showSplash, setShowSplash] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    // Clear auth for testing - remove this line later
    localStorage.removeItem('polydraft-authenticated');
    localStorage.removeItem('polydraft-visited');
    
    // Always check auth on load
    const authStatus = localStorage.getItem('polydraft-authenticated');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      // Show drawer for unauthenticated users
      setShowDrawer(true);
    }
  }, []);

  const handleAuthenticate = () => {
    // Simulate Base authentication
    setTimeout(() => {
      setIsAuthenticated(true);
      localStorage.setItem('polydraft-authenticated', 'true');
      setShowDrawer(false);
      setShowSplash(false);
    }, 1000);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    // Show drawer again after 3 seconds if not authenticated
    if (!isAuthenticated) {
      setTimeout(() => setShowDrawer(true), 3000);
    }
  };

  // If authenticated, don't render anything (let main app show)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Splash Screen Background */}
      {showSplash && (
        <div className="fixed inset-0 z-40 bg-background">
          <div className="h-full flex flex-col items-center justify-center px-6">
            {/* Logo */}
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/30">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.6667 42.6667L21.3333 32L32 37.3333L42.6667 21.3333L53.3333 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="21.3333" cy="32" r="2.66667" fill="white"/>
                <circle cx="32" cy="37.3333" r="2.66667" fill="white"/>
                <circle cx="42.6667" cy="21.3333" r="2.66667" fill="white"/>
                <circle cx="10.6667" cy="42.6667" r="2.66667" fill="white"/>
                <circle cx="53.3333" cy="32" r="2.66667" fill="white"/>
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-3">PolyDraft</h1>
            <p className="text-text-muted text-center mb-12">
              Fantasy leagues for prediction markets
            </p>

            {/* Loading Animation */}
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Drawer */}
      <SplashDrawer
        isOpen={showDrawer}
        onClose={handleCloseDrawer}
        onAuthenticate={handleAuthenticate}
      />
    </>
  );
}