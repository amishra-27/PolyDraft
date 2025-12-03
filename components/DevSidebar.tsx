'use client';

import { useState } from 'react';
import { useDevSettings } from '@/lib/contexts/DevSettingsContext';
import {
  Code2,
  ChevronLeft,
  ChevronRight,
  Database,
  Info,
  Target,
  Palette,
  Smartphone,
  Monitor,
  Wifi,
  Activity
} from 'lucide-react';

export function DevSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, toggleSetting } = useDevSettings();

  // Only show on desktop (>768px)
  return (
    <div className="hidden md:block fixed right-0 top-0 h-screen z-50">
      {/* Toggle Button */}
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

      {/* Sidebar Panel */}
      <div
        className={`h-full bg-surface/95 backdrop-blur-md border-l border-white/10 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
            <Code2 size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-white">Developer Settings</h2>
          </div>

          {/* Device Preview Info */}
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase">Preview Mode</span>
            </div>
            <p className="text-xs text-text-muted">
              Main viewport simulates mobile Mini App (max-width: 448px)
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Data Settings */}
            <section>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Database size={16} className="text-text-muted" />
                Data
              </h3>
              <div className="space-y-3">
                <ToggleSwitch
                  label="Show Dummy Data"
                  description="Display mock leagues, users, and markets"
                  checked={settings.showDummyData}
                  onChange={() => toggleSetting('showDummyData')}
                />
                <ToggleSwitch
                  label="Enable CLOB WebSocket"
                  description="Real-time token price updates"
                  checked={settings.enableCLOBWebSocket}
                  onChange={() => toggleSetting('enableCLOBWebSocket')}
                />
                <ToggleSwitch
                  label="Enable RTDS WebSocket"
                  description="Real-time market updates and crypto prices"
                  checked={settings.enableRTDSWebSocket}
                  onChange={() => toggleSetting('enableRTDSWebSocket')}
                />
              </div>
            </section>

            {/* WebSocket Settings */}
            <section>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Wifi size={16} className="text-text-muted" />
                WebSocket
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">RTDS Channels</span>
                    <Activity size={12} className="text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {settings.rtdsChannels.map(channel => (
                      <span key={channel} className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">RTDS Filters</span>
                  </div>
                  <div className="space-y-1 text-[10px] text-text-dim">
                    <div>Active Only: {settings.rtdsFilters.active_only ? 'Yes' : 'No'}</div>
                    <div>Categories: {settings.rtdsFilters.categories.length > 0 ? settings.rtdsFilters.categories.join(', ') : 'All'}</div>
                    <div>Symbols: {settings.rtdsFilters.symbols.join(', ')}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Debug Settings */}
            <section>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Info size={16} className="text-text-muted" />
                Debug
              </h3>
              <div className="space-y-3">
                <ToggleSwitch
                  label="Show Debug Info"
                  description="Display component state and props"
                  checked={settings.showDebugInfo}
                  onChange={() => toggleSetting('showDebugInfo')}
                />
                <ToggleSwitch
                  label="Highlight Touch Targets"
                  description="Show 44px minimum touch target overlays"
                  checked={settings.highlightTouchTargets}
                  onChange={() => toggleSetting('highlightTouchTargets')}
                />
              </div>
            </section>

            {/* Theme Info */}
            <section>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Palette size={16} className="text-text-muted" />
                Theme
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-xs text-text-muted">Primary</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary border border-white/20" />
                    <span className="text-xs text-text-dim font-mono">#ef4444</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-xs text-text-muted">Secondary</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-secondary border border-white/20" />
                    <span className="text-xs text-text-dim font-mono">#ff6b6b</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-xs text-text-muted">Success</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-success border border-white/20" />
                    <span className="text-xs text-text-dim font-mono">#10b981</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Viewport Info */}
            <section>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Monitor size={16} className="text-text-muted" />
                Viewport Info
              </h3>
              <div className="p-3 bg-background rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Max Width:</span>
                  <span className="text-white font-mono">448px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Orientation:</span>
                  <span className="text-white">Portrait</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Touch Targets:</span>
                  <span className="text-success">≥44px</span>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => localStorage.clear()}
                  className="w-full text-left p-3 bg-error/10 border border-error/20 rounded-lg hover:bg-error/20 transition-colors text-xs text-error font-medium"
                >
                  Clear LocalStorage
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full text-left p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs text-text-muted font-medium"
                >
                  Reload Page
                </button>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[10px] text-text-dim">
              Developer sidebar is hidden on mobile (≤768px)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-3 bg-background rounded-lg">
      <div className="flex-1">
        <label className="text-sm font-medium text-white cursor-pointer" onClick={onChange}>
          {label}
        </label>
        <p className="text-xs text-text-dim mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
          checked ? 'bg-primary' : 'bg-white/20'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
