'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logError, parseError } from '@/lib/utils/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error
    const draftError = parseError(error);
    logError(draftError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const canRetry = this.state.retryCount < this.maxRetries;
      const isNetworkError = this.state.error?.message.toLowerCase().includes('network') ||
                           this.state.error?.message.toLowerCase().includes('fetch');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-error" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-text-muted text-sm mb-6 leading-relaxed">
              {isNetworkError 
                ? 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.'
                : 'An unexpected error occurred while loading this page. Our team has been notified.'
              }
            </p>

            {/* Retry Count */}
            {this.state.retryCount > 0 && (
              <div className="mb-6 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-warning text-sm">
                  Retry attempt {this.state.retryCount} of {this.maxRetries}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry ? (
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="primary"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                    <p className="text-error text-sm mb-2">
                      Maximum retry attempts reached
                    </p>
                    <p className="text-text-dim text-xs">
                      Please refresh the page or try again later
                    </p>
                  </div>
                  
                  <Button
                    onClick={this.handleReset}
                    className="w-full"
                    variant="secondary"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Reset & Try Again
                  </Button>
                </div>
              )}

              <Button
                onClick={this.handleGoHome}
                className="w-full"
                variant="outline"
              >
                <Home size={16} className="mr-2" />
                Go to Homepage
              </Button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-text-dim cursor-pointer hover:text-text-muted mb-2">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-surface-hover border border-white/10 rounded-lg text-xs">
                  <div className="mb-2">
                    <strong className="text-error">Error:</strong>
                    <pre className="mt-1 text-text-dim whitespace-pre-wrap break-all">
                      {this.state.error.message}
                    </pre>
                  </div>
                  
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-error">Component Stack:</strong>
                      <pre className="mt-1 text-text-dim whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    const draftError = parseError(error);
    logError(draftError, { 
      errorBoundary: 'hook',
      timestamp: new Date().toISOString()
    });
    setError(error);
  }, []);

  // Throw error to be caught by nearest error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};