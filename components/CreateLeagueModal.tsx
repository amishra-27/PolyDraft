'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Trophy, Users, Clock, ArrowUpDown, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/lib/utils/toast';
import { 
  DraftErrorClass, 
  ErrorCode,
  createNetworkError, 
  createTimeoutError, 
  createValidationError,
  retryWithBackoff,
  logError,
  parseError 
} from '@/lib/utils/error-handling';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  leagueName: string;
  numberOfPlayers: string;
  draftType: string;
  draftTimePerPick: string;
  leagueDescription: string;
}

interface FormErrors {
  leagueName?: string;
  general?: string;
  network?: string;
}

export function CreateLeagueModal({ isOpen, onClose }: CreateLeagueModalProps) {
  const [formData, setFormData] = useState<FormData>({
    leagueName: '',
    numberOfPlayers: '6',
    draftType: 'Snake',
    draftTimePerPick: '45s',
    leagueDescription: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<void>) | null>(null);
  const { showError, showSuccess: showSuccessToast, showWarning } = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        leagueName: '',
        numberOfPlayers: '6',
        draftType: 'Snake',
        draftTimePerPick: '45s',
        leagueDescription: '',
      });
      setErrors({});
      setShowSuccess(false);
    }
  }, [isOpen]);

  const validateForm = async (): Promise<boolean> => {
    setIsValidating(true);
    const newErrors: FormErrors = {};

    try {
      // Basic validation
      if (!formData.leagueName.trim()) {
        newErrors.leagueName = 'League name is required';
      } else if (formData.leagueName.trim().length < 3) {
        newErrors.leagueName = 'League name must be at least 3 characters';
      } else if (formData.leagueName.trim().length > 50) {
        newErrors.leagueName = 'League name must be less than 50 characters';
      }

      // Simulate async validation with potential network error
      await retryWithBackoff(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simulate occasional validation server error
        if (Math.random() < 0.05) {
          throw createNetworkError('Validation service unavailable');
        }
      }, {
        maxAttempts: 2,
        shouldRetry: (error, attempt) => error.retryable && attempt < 2
      });

    } catch (err) {
      const error = parseError(err);
      logError(error, { action: 'validateForm', leagueName: formData.leagueName });
      
      if (error.code === ErrorCode.NETWORK_ERROR) {
        newErrors.network = 'Unable to validate league name. Please check your connection.';
      } else {
        newErrors.general = 'Validation failed. Please try again.';
      }
    }
    
    setErrors(newErrors);
    setIsValidating(false);
    return Object.keys(newErrors).length === 0;
  };

  const createLeagueAction = async () => {
    // Mock API call with various error scenarios
    await retryWithBackoff(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate different error scenarios
      const random = Math.random();
      if (random < 0.1) {
        throw createNetworkError('Unable to connect to league creation service');
      } else if (random < 0.15) {
        throw createTimeoutError(5000);
      } else if (random < 0.2) {
        throw new DraftErrorClass({
          code: ErrorCode.LEAGUE_FULL,
          message: 'League creation failed - system at capacity',
          retryable: true,
          userMessage: 'System is currently at capacity. Please try again in a few minutes.'
        });
      } else if (formData.leagueName.toLowerCase().includes('test')) {
        throw new DraftErrorClass({
          code: ErrorCode.INVALID_LEAGUE_ID,
          message: 'League name contains restricted word',
          retryable: false,
          userMessage: 'League name cannot contain the word "test". Please choose a different name.'
        });
      }
    }, {
      maxAttempts: 3,
      baseDelay: 1000,
      shouldRetry: (error, attempt) => error.retryable && attempt < 3
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setRetryCount(0);

    try {
      await createLeagueAction();
      
      // Success
      setShowSuccess(true);
      showSuccessToast('League created successfully!');
      
      // Close modal after success message
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      const error = parseError(err);
      logError(error, { 
        action: 'createLeague', 
        leagueName: formData.leagueName,
        numberOfPlayers: formData.numberOfPlayers 
      });
      
      setLastFailedAction(() => createLeagueAction());
      
      if (error.code === ErrorCode.NETWORK_ERROR || error.code === ErrorCode.TIMEOUT_ERROR) {
        setErrors({ 
          network: error.userMessage 
        });
        showError(error);
      } else if (error.code === ErrorCode.INVALID_LEAGUE_ID) {
        setErrors({ 
          leagueName: error.userMessage 
        });
        showError(error);
      } else {
        setErrors({ 
          general: error.userMessage 
        });
        showError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!lastFailedAction) return;
    
    setRetryCount(prev => prev + 1);
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await lastFailedAction();
      setLastFailedAction(null);
      setRetryCount(0);
    } catch (err) {
      const error = parseError(err);
      logError(error, { action: 'retryCreateLeague', retryCount: retryCount + 1 });
      
      if (retryCount >= 2) {
        setErrors({ 
          general: 'Multiple retry attempts failed. Please check your connection and try again later.' 
        });
        showWarning('Maximum retry attempts reached. Please try again later.');
      } else {
        setErrors({ 
          general: `Retry attempt failed. ${error.retryable ? 'You can try again.' : 'Please check your input and try again.'}` 
        });
        showError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors.leagueName && field === 'leagueName') {
      setErrors(prev => ({ ...prev, leagueName: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white">Create New League</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 border-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {showSuccess ? (
            <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">League Created!</h3>
              <p className="text-text-muted">Your league has been successfully created.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* League Name */}
              <div className="relative">
                <label className="block text-sm font-semibold text-white mb-2">
                  League Name <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.leagueName}
                    onChange={(e) => handleInputChange('leagueName', e.target.value)}
                    className={`w-full px-4 py-3 bg-surface-hover border rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10 ${
                      errors.leagueName 
                        ? 'border-error/50 focus:ring-error' 
                        : 'border-white/20'
                    } ${isValidating ? 'animate-pulse' : ''}`}
                    placeholder="Enter league name"
                    maxLength={50}
                    disabled={isSubmitting}
                  />
                  {isValidating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {errors.leagueName && (
                  <p className="mt-1 text-xs text-error font-medium animate-in fade-in slide-in-from-top-1 duration-200">{errors.leagueName}</p>
                )}
                <p className="mt-1 text-xs text-text-dim">
                  {formData.leagueName.length}/50 characters
                </p>
              </div>

              {/* Number of Players */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Number of Players
                </label>
                <select
                  value={formData.numberOfPlayers}
                  onChange={(e) => handleInputChange('numberOfPlayers', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-hover border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="4">4 Players</option>
                  <option value="6">6 Players</option>
                  <option value="8">8 Players</option>
                  <option value="10">10 Players</option>
                </select>
              </div>

              {/* Draft Type */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <ArrowUpDown className="w-4 h-4 inline mr-1" />
                  Draft Type
                </label>
                <select
                  value={formData.draftType}
                  onChange={(e) => handleInputChange('draftType', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-hover border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="Snake">Snake Draft</option>
                  <option value="Linear">Linear Draft</option>
                </select>
              </div>

              {/* Draft Time per Pick */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time per Pick
                </label>
                <select
                  value={formData.draftTimePerPick}
                  onChange={(e) => handleInputChange('draftTimePerPick', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-hover border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="30s">30 seconds</option>
                  <option value="45s">45 seconds</option>
                  <option value="60s">60 seconds</option>
                  <option value="90s">90 seconds</option>
                </select>
              </div>

              {/* League Description */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  League Description <span className="text-text-dim text-xs">(optional)</span>
                </label>
                <textarea
                  value={formData.leagueDescription}
                  onChange={(e) => handleInputChange('leagueDescription', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-hover border border-white/20 rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none disabled:opacity-50"
                  placeholder="Describe your league rules, theme, or any special details..."
                  rows={3}
                  maxLength={200}
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-text-dim">
                  {formData.leagueDescription.length}/200 characters
                </p>
              </div>

              {/* Network Error */}
              {errors.network && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-warning font-medium">{errors.network}</p>
                      {retryCount < 3 && (
                        <button
                          onClick={handleRetry}
                          disabled={isSubmitting}
                          className="mt-2 text-xs text-warning hover:text-warning/80 font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                          {isSubmitting ? 'Retrying...' : `Retry (${retryCount}/3)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-error flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-error font-medium">{errors.general}</p>
                      {lastFailedAction && retryCount < 3 && (
                        <button
                          onClick={handleRetry}
                          disabled={isSubmitting}
                          className="mt-2 text-xs text-error hover:text-error/80 font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                          {isSubmitting ? 'Retrying...' : `Retry (${retryCount}/3)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create League'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}