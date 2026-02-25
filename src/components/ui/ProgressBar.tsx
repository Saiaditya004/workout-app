import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
}

export default function ProgressBar({ value, max, label, className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-medium text-gray-800">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
