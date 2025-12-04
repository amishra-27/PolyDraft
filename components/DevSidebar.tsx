'use client';

import { useState } from 'react';
import { useDevSettings } from '@/lib/contexts/DevSettingsContext';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';

export function DevSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, toggleSetting } = useDevSettings();

  return (
    <div className="hidden md:block fixed right-0 top-0 h-screen z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-surface border border-white/10 border-r-0 rounded-l-lg p-2 hover:bg-surface-hover transition-colors"
        aria-label="Toggle developer settings"
      >
        {isOpen ? (
          <ChevronRight size={20} className="text-primary" />
        ) : (
          <ChevronLeft size={20} className="text-primary" />
        )}
      </button>

      <div
        className={`h-full bg-surface/95 backdrop-blur-md border-l border-white/10 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Dev Settings</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Data Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Show Dummy Data</span>
                  <input
                    type="checkbox"
                    checked={settings.showDummyData}
                    onChange={() => toggleSetting('showDummyData')}
                    className="w-4 h-4 text-primary bg-surface border-gray-600 rounded focus:ring-primary focus:ring-2"
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Clear Storage & Reload
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-surface border border-white/10 rounded-lg text-gray-300 hover:bg-surface-hover transition-colors text-sm"
                >
                  <RotateCcw size={16} />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}