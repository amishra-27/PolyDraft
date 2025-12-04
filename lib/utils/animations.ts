// Animation utility functions and constants for consistent animations across the app

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 1000,
} as const;

export const ANIMATION_EASING = {
  easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const STAGGER_DELAYS = {
  fast: 50,
  normal: 100,
  slow: 150,
} as const;

// Utility function to generate staggered animation delays
export function getStaggeredDelay(index: number, baseDelay: number = STAGGER_DELAYS.normal): number {
  return index * baseDelay;
}

// Utility function to create animation styles
export function createAnimationStyle(
  delay: number = 0,
  duration: number = ANIMATION_DURATIONS.normal,
  easing: string = ANIMATION_EASING.easeOut
): React.CSSProperties {
  return {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
    animationTimingFunction: easing,
  };
}

// Common animation classes
export const ANIMATION_CLASSES = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  
  // Slide animations
  slideInFromBottom: 'animate-in slide-in-from-bottom-4 duration-300',
  slideInFromTop: 'animate-in slide-in-from-top-4 duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left-4 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-4 duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-300',
  
  // Combined animations
  slideUpFadeIn: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
  slideDownFadeIn: 'animate-in fade-in slide-in-from-top-4 duration-300',
  slideLeftFadeIn: 'animate-in fade-in slide-in-from-left-4 duration-300',
  slideRightFadeIn: 'animate-in fade-in slide-in-from-right-4 duration-300',
  
  // Hover effects
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 transition-transform duration-200',
  hoverGlow: 'hover:shadow-lg transition-shadow duration-200',
  
  // Loading animations
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
} as const;

// Transition utilities
export const TRANSITIONS = {
  // Fast transitions
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
  
  // Specific property transitions
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
  shadow: 'transition-shadow duration-200',
} as const;

// Keyframe animations for custom use
export const KEYFRAMES = {
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.5); }
      50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.8), 0 0 30px rgba(6, 182, 212, 0.4); }
    }
  `,
  slideInStaggered: `
    @keyframes slide-in-staggered {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
} as const;

// Utility function to apply shimmer effect
export function getShimmerStyle(): React.CSSProperties {
  return {
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200px 100%',
    animation: 'shimmer 1.5s infinite',
  };
}

// Utility function for staggered list animations
export function getStaggeredChildrenProps<T>(
  items: T[],
  baseDelay: number = STAGGER_DELAYS.normal
): Array<{ key: string | number; style: React.CSSProperties }> {
  return items.map((item, index) => ({
    key: typeof item === 'object' && item !== null ? (item as any).id || index : index,
    style: createAnimationStyle(getStaggeredDelay(index, baseDelay)),
  }));
}

// Loading state variants
export const LOADING_STATES = {
  skeleton: 'animate-pulse bg-surface/50',
  shimmer: 'relative overflow-hidden',
  spinner: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
} as const;

// Status color combinations with animations
export const STATUS_ANIMATIONS = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    icon: 'animate-pulse',
  },
  error: {
    bg: 'bg-error/10',
    border: 'border-error/30',
    text: 'text-error',
    icon: 'animate-pulse',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    icon: 'animate-pulse',
  },
  info: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    text: 'text-info',
    icon: 'animate-pulse',
  },
} as const;