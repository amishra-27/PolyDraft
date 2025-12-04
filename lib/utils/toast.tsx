import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { DraftErrorClass } from './error-handling';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showError: (error: DraftErrorClass | string, title?: string) => string;
  showSuccess: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration (unless persistent)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showError = useCallback((error: DraftErrorClass | string, title?: string) => {
    if (typeof error === 'string') {
      return addToast({
        type: 'error',
        title: title || 'Error',
        message: error,
        persistent: false
      });
    }

    return addToast({
      type: 'error',
      title: title || 'Error',
      message: error.userMessage,
      persistent: !error.retryable,
      action: error.retryable ? {
        label: 'Retry',
        onClick: error.recovery || (() => {})
      } : undefined
    });
  }, [addToast]);

  const showSuccess = useCallback((message: string, title?: string) => {
    return addToast({
      type: 'success',
      title: title || 'Success',
      message,
      persistent: false
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    return addToast({
      type: 'warning',
      title: title || 'Warning',
      message,
      persistent: false
    });
  }, [addToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    return addToast({
      type: 'info',
      title: title || 'Info',
      message,
      persistent: false
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      clearToasts,
      showError,
      showSuccess,
      showWarning,
      showInfo
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} className="text-success flex-shrink-0" />;
      case 'error':
        return <AlertCircle size={20} className="text-error flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-warning flex-shrink-0" />;
      case 'info':
        return <Info size={20} className="text-info flex-shrink-0" />;
      default:
        return <Info size={20} className="text-info flex-shrink-0" />;
    }
  };

  const getToastStyles = () => {
    const baseStyles = "bg-surface border border-white/10 rounded-lg shadow-lg backdrop-blur-md p-4 min-w-[300px] max-w-md";
    const typeStyles = {
      success: "border-success/30",
      error: "border-error/30",
      warning: "border-warning/30",
      info: "border-info/30"
    };

    return `${baseStyles} ${typeStyles[toast.type]}`;
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        transform transition-all duration-300 ease-in-out
        ${isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm mb-1">
            {toast.title}
          </h4>
          
          {toast.message && (
            <p className="text-text-muted text-sm leading-relaxed">
              {toast.message}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-primary text-sm font-medium hover:text-primary-hover transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};