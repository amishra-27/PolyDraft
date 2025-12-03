'use client';

import { useDevSettings } from "@/lib/contexts/DevSettingsContext";

export default function AnalyticsPage() {
  const { settings } = useDevSettings();

  return (
    <div className="pb-24">
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-text-muted text-sm">Track your performance</p>
      </header>

      <div className="p-12 bg-surface border border-white/5 rounded-xl text-center">
        <p className="text-text-muted text-sm mb-2">Analytics coming soon</p>
        <p className="text-text-dim text-xs">
          {!settings.showDummyData
            ? "Enable dummy data in dev settings"
            : "Feature in development"}
        </p>
      </div>
    </div>
  );
}
