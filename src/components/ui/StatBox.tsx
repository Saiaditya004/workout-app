import React, { type ReactNode } from 'react';

interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export default function StatBox({ label, value, icon, className = '' }: StatBoxProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
        {icon && <span className="text-blue-500">{icon}</span>}
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
