import React from 'react';
import type { LeaderboardEntry } from '../../types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightId?: string;
  limit?: number;
}

export default function LeaderboardTable({ entries, highlightId, limit }: LeaderboardTableProps) {
  const sorted = [...entries].sort((a, b) => b.currentStreak - a.currentStreak);
  const display = limit ? sorted.slice(0, limit) : sorted;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 w-12">#</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 text-center">Streak 🔥</th>
            <th className="px-4 py-3 text-center">This Week</th>
          </tr>
        </thead>
        <tbody>
          {display.map((entry, i) => (
            <tr
              key={entry.traineeId}
              className={`border-t border-gray-50 ${entry.traineeId === highlightId ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
            >
              <td className="px-4 py-3 text-sm font-bold text-gray-400">
                {i + 1}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {entry.name}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-orange-500">
                {entry.currentStreak} 🔥
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-600">
                {entry.workoutsThisWeek}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
